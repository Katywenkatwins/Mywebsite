"use client";

/*
 * Стопка карток віялом: верхня картка злітає вбік і пружно ховається під низ стопки, решта підтягується.
 * Портовано зі Stack (React Bits / присланий код) на motion: ті самі пружини, нахил при перетягуванні, «кидок».
 * Керування ззовні: step — скільки карток уже перегорнуто (0 … n−1). Коли step росте — верхня летить назад,
 * коли зменшується — остання картка прилітає назад нагору. Клік, кидок і клавіші не гортають самі, а просять
 * onRequest(наступний step) — так секція може гортати ще й скролом і тримати все в одному стані.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { animate, motion, motionValue, useReducedMotion, type MotionValue } from "motion/react";

const ORIGIN: [number, number] = [0.9, 0.9];
const EXIT: [number, number] = [1, -0.3];
const SHADOW = "0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)";
const CLICK_SLOP = 6;
const FLICK_SPEED = 650;
const LEAN_SPEED = 1300;
const LEAN_REACH = 260;
const PRESS_SCALE = 1.035;
const STEP_GAP_MS = 110; // якщо гортаємо кілька карток одразу — пауза між ними
const SPRINGS = {
  place: [260, 24],
  settle: [320, 34],
  tuck: [240, 28],
  face: [240, 30],
  lean: [240, 28],
  press: [420, 34],
  fling: [650, 42],
} as const;
type SpringKind = keyof typeof SPRINGS;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Values = Record<
  "x" | "y" | "rotate" | "scale" | "tiltX" | "tiltY" | "spin" | "lift" | "grabX" | "grabY" | "z" | "opacity" | "shade",
  MotionValue<number>
>;
type Drag = {
  card: number;
  id: number;
  element: HTMLElement;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  idle: ReturnType<typeof setTimeout> | undefined;
  moved: boolean;
  progress: number;
  samples: [number, number, number][];
};

const releaseVelocity = (samples: [number, number, number][], time: number): [number, number] => {
  const recent = samples.filter((s) => time - s[2] <= 100);
  if (recent.length < 2) return [0, 0];
  const first = recent[0];
  const last = recent[recent.length - 1];
  const elapsed = Math.max((last[2] - first[2]) / 1000, 0.008);
  return [(last[0] - first[0]) / elapsed, (last[1] - first[1]) / elapsed];
};

type Props = {
  cards: ReactNode[];
  /** скільки карток перегорнуто (0 … n−1) */
  step: number;
  onRequest: (step: number) => void;
  /** скільки карток видно у стопці */
  visible?: number;
  spread?: number;
  depth?: number;
  /** радіус кутів, px макета (множиться на --u) */
  radius?: number;
  tilt?: number;
  /** на скільки px треба відтягти картку, щоб вона полетіла */
  threshold?: number;
  label: string;
  className?: string;
  style?: CSSProperties;
};

export function CardStack({
  cards,
  step,
  onRequest,
  visible = 4,
  spread = 0.5,
  depth = 0.5,
  radius = 20,
  tilt = 30,
  threshold = 90,
  label,
  className = "",
  style,
}: Props) {
  const count = cards.length;
  const reduceMotion = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const rotated = (k: number) => Array.from({ length: count }, (_, i) => (i + k) % count);
  const [order, setOrder] = useState(() => rotated(step));
  const [dragging, setDragging] = useState(false);
  // анімовані значення кожної картки (створюються один раз)
  const [values] = useState(() => {
    const map = new Map<number, Values>();
    const shownMax = clamp(Math.round(visible), 1, Math.max(count, 1));
    order.forEach((index, position) => {
      const shown = reduceMotion ? Math.min(position, shownMax - 1) : 0;
      map.set(index, {
        x: motionValue(0),
        y: motionValue(0),
        rotate: motionValue(shown * clamp(spread, 0, 2) * 8),
        scale: motionValue(1 - shown * clamp(depth, 0, 1) * 0.12),
        tiltX: motionValue(0),
        tiltY: motionValue(0),
        spin: motionValue(0),
        lift: motionValue(1),
        grabX: motionValue(0.5),
        grabY: motionValue(0.5),
        z: motionValue(count - position),
        opacity: motionValue(position < shownMax ? 1 : 0),
        shade: motionValue(0),
      });
    });
    return map;
  });
  const orderRef = useRef(order);
  const appliedRef = useRef(step);
  const elementsRef = useRef(new Map<number, HTMLElement>());
  const flyingRef = useRef(new Map<number, { turned: boolean }>());
  const dragRef = useRef<Drag | null>(null);
  const aliveRef = useRef(true);
  const mountedRef = useRef(false);
  const queueRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stepRef = useRef(step);
  const requestRef = useRef(onRequest);

  const s = {
    visible: clamp(Math.round(visible), 1, Math.max(count, 1)),
    spread: clamp(spread, 0, 2),
    depth: clamp(depth, 0, 1),
    tilt: clamp(tilt, 0, 89),
    threshold: Math.max(threshold, 0),
    count,
    reduceMotion,
  };
  const sRef = useRef(s);
  // свіжі пропси для обробників подій
  useLayoutEffect(() => {
    stepRef.current = step;
    requestRef.current = onRequest;
    sRef.current = s;
  });

  // віяло: кожна наступна картка трохи повернута й менша
  const placement = (position: number) => {
    const { spread: sp, depth: dp } = sRef.current;
    return { x: 0, y: 0, rotate: position * sp * 8, scale: 1 - position * dp * 0.12 };
  };

  const valuesFor = (index: number): Values => values.get(index)!;

  const springFor = (kind: SpringKind, extra: { delay?: number; velocity?: number } = {}) => {
    if (sRef.current.reduceMotion) return { duration: 0.2, ease: "easeOut" as const, delay: extra.delay || 0 };
    const [stiffness, damping] = SPRINGS[kind];
    return { type: "spring" as const, stiffness, damping, restDelta: 0.01, restSpeed: 0.5, ...extra };
  };

  const settleFace = (v: Values, delay = 0) => {
    const t = springFor("face", { delay });
    animate(v.tiltX, 0, t);
    animate(v.tiltY, 0, t);
    animate(v.spin, 0, t);
    animate(v.lift, 1, t);
  };

  const placeCard = (
    index: number,
    position: number,
    {
      delay = 0,
      lift = 0,
      kind = "place" as SpringKind,
      velocity = null as [number, number] | null,
      keepZ = false,
    } = {},
  ) => {
    const st = sRef.current;
    const v = valuesFor(index);
    const shown = Math.min(position, st.visible - 1);
    const target = placement(shown);
    if (lift > 0 && shown > 0) {
      const ahead = placement(shown - 1);
      target.x = mix(target.x, ahead.x, lift);
      target.y = mix(target.y, ahead.y, lift);
      target.rotate = mix(target.rotate, ahead.rotate, lift);
      target.scale = mix(target.scale, ahead.scale, lift);
    }
    const spring = springFor(kind, { delay });
    const fade = { duration: st.reduceMotion ? 0.2 : 0.35, ease: "easeOut" as const, delay };
    if (!keepZ) v.z.set(st.count - position);
    animate(v.x, target.x, velocity ? { ...spring, velocity: velocity[0] } : spring);
    animate(v.y, target.y, velocity ? { ...spring, velocity: velocity[1] } : spring);
    animate(v.rotate, target.rotate, spring);
    animate(v.scale, target.scale, spring);
    settleFace(v, delay);
    animate(v.opacity, position < st.visible ? 1 : 0, fade);
    animate(v.shade, Math.min(0.6, shown * st.depth * 0.14 * (1 - lift)), fade);
  };

  const placeAll = ({
    stagger = 0,
    lift = 0,
    released = -1,
    velocity = null as [number, number] | null,
    kind = "place" as SpringKind,
  } = {}) => {
    const drag = dragRef.current;
    orderRef.current.forEach((index, position) => {
      const flight = flyingRef.current.get(index);
      if (flight && !flight.turned) return;
      if (drag && drag.moved && drag.card === index) return;
      const isReleased = index === released;
      placeCard(index, position, {
        delay: position * stagger,
        lift: position > 0 ? lift : 0,
        kind: flight ? "tuck" : isReleased ? "settle" : kind,
        velocity: isReleased ? velocity : null,
        keepZ: !!flight,
      });
    });
  };

  const commit = (next: number[]) => {
    orderRef.current = next;
    setOrder(next);
  };

  // куди летить картка: від «дому» в напрямку dir за межі стопки
  const exitPoint = (dir: [number, number] | null) => {
    let [dx, dy] = dir || EXIT;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const bounds = rootRef.current?.getBoundingClientRect();
    const width = bounds?.width || 240;
    const height = bounds?.height || 240;
    const clearance = Math.min(width / Math.max(Math.abs(dx), 0.01), height / Math.max(Math.abs(dy), 0.01));
    const travel = clearance * 1.12 + 40;
    return { out: [dx * travel, dy * travel] as [number, number], dx, dy };
  };

  // верхня картка → під низ
  const sendToBack = (direction: [number, number] | null, velocity: [number, number] | null = null) => {
    const st = sRef.current;
    const current = orderRef.current;
    if (current.length < 2) return;
    const top = current[0];
    const next = [...current.slice(1), top];
    if (st.reduceMotion) {
      commit(next);
      return;
    }
    const { out, dx, dy } = exitPoint(direction);
    const v = valuesFor(top);
    const launch = springFor("fling");
    const flight = { turned: false };
    flyingRef.current.set(top, flight);
    v.z.set(st.count + 1);
    animate(v.x, out[0], velocity ? { ...launch, velocity: velocity[0] } : launch);
    animate(v.y, out[1], velocity ? { ...launch, velocity: velocity[1] } : launch);
    settleFace(v);
    commit(next);
    const span = Math.max(Math.hypot(out[0] - v.x.get(), out[1] - v.y.get()), 1);
    let landed = false;
    const turn = () => {
      flight.turned = true;
      const position = orderRef.current.indexOf(top);
      if (position >= 0) placeCard(top, position, { kind: "tuck", keepZ: !landed });
    };
    const land = () => {
      landed = true;
      if (flyingRef.current.get(top) === flight) flyingRef.current.delete(top);
      const position = orderRef.current.indexOf(top);
      if (position >= 0) v.z.set(sRef.current.count - position);
    };
    const fallback = setTimeout(() => {
      if (!flight.turned) turn();
      if (!landed) land();
    }, 1500);
    const clearOfPile = () => {
      const element = elementsRef.current.get(top);
      if (!element) return true;
      const mine = element.getBoundingClientRect();
      for (const [index, other] of elementsRef.current) {
        if (index === top || flyingRef.current.has(index) || valuesFor(index).opacity.get() < 0.5) continue;
        const box = other.getBoundingClientRect();
        if (mine.left < box.right && mine.right > box.left && mine.top < box.bottom && mine.bottom > box.top) return false;
      }
      return true;
    };
    const watch = () => {
      if (!aliveRef.current || (flight.turned && landed)) {
        clearTimeout(fallback);
        return;
      }
      const x = v.x.get();
      const y = v.y.get();
      const outward = v.x.getVelocity() * dx + v.y.getVelocity() * dy;
      if (!flight.turned && (Math.hypot(out[0] - x, out[1] - y) <= span * 0.06 || outward < 0)) turn();
      if (!landed && (clearOfPile() || (flight.turned && outward < 0))) land();
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  };

  // нижня картка → прилітає нагору (гортання назад)
  const bringToFront = () => {
    const st = sRef.current;
    const current = orderRef.current;
    if (current.length < 2) return;
    const last = current[current.length - 1];
    const next = [last, ...current.slice(0, -1)];
    if (st.reduceMotion) {
      commit(next);
      return;
    }
    const { out } = exitPoint(null);
    const v = valuesFor(last);
    flyingRef.current.delete(last);
    v.x.set(out[0]);
    v.y.set(out[1]);
    v.rotate.set(0);
    v.scale.set(1);
    v.opacity.set(1);
    v.shade.set(0);
    commit(next);
    v.z.set(st.count + 1);
  };

  // підтягуємо стопку до step: по одній картці з паузою
  useEffect(() => {
    const run = () => {
      queueRef.current = undefined;
      const target = stepRef.current;
      const diff = target - appliedRef.current;
      if (!diff) return;
      if (diff > 0) {
        appliedRef.current += 1;
        sendToBack(null);
      } else {
        appliedRef.current -= 1;
        bringToFront();
      }
      if (appliedRef.current !== target) queueRef.current = setTimeout(run, sRef.current.reduceMotion ? 0 : STEP_GAP_MS);
    };
    if (!queueRef.current) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const lean = (drag: Drag) => {
    const st = sRef.current;
    if (st.reduceMotion) return;
    const v = valuesFor(drag.card);
    const offsetX = v.x.get() - drag.homeX;
    const offsetY = v.y.get() - drag.homeY;
    const sideways = clamp(drag.vx / LEAN_SPEED, -1, 1) * 0.7 + clamp(offsetX / LEAN_REACH, -1, 1) * 0.3;
    const upward = clamp(-drag.vy / LEAN_SPEED, -1, 1) * 0.7 + clamp(-offsetY / LEAN_REACH, -1, 1) * 0.3;
    const follow = springFor("lean");
    animate(v.tiltY, sideways * st.tilt, follow);
    animate(v.tiltX, upward * st.tilt, follow);
    animate(v.spin, clamp(offsetX / LEAN_REACH, -1, 1) * 6, follow);
  };

  const nextStep = () => (stepRef.current + 1) % Math.max(count, 1);

  const onMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id) return;
    const st = sRef.current;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const v = valuesFor(drag.card);
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < CLICK_SLOP) return;
      drag.moved = true;
      v.x.stop();
      v.y.stop();
      drag.originX = v.x.get() - dx;
      drag.originY = v.y.get() - dy;
      try {
        drag.element.setPointerCapture(drag.id);
      } catch {}
      setDragging(true);
    }
    v.x.set(drag.originX + dx);
    v.y.set(drag.originY + dy);
    drag.samples.push([event.clientX, event.clientY, event.timeStamp]);
    if (drag.samples.length > 12) drag.samples.shift();
    [drag.vx, drag.vy] = releaseVelocity(drag.samples, event.timeStamp);
    lean(drag);
    clearTimeout(drag.idle);
    drag.idle = setTimeout(() => {
      if (dragRef.current !== drag) return;
      drag.vx = 0;
      drag.vy = 0;
      lean(drag);
    }, 70);
    const progress = clamp(Math.hypot(dx, dy) / Math.max(st.threshold, 1), 0, 1);
    if (Math.abs(progress - drag.progress) > 0.02) {
      drag.progress = progress;
      placeAll({ lift: progress * 0.4, kind: "settle" });
    }
  };

  const onUp = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id) return;
    dragRef.current = null;
    clearTimeout(drag.idle);
    window.removeEventListener("pointermove", listeners.current.move);
    window.removeEventListener("pointerup", listeners.current.up);
    window.removeEventListener("pointercancel", listeners.current.up);
    try {
      drag.element.releasePointerCapture(drag.id);
    } catch {}
    const st = sRef.current;
    if (!drag.moved) {
      // клік — наступна картка
      settleFace(valuesFor(drag.card));
      if (event.type === "pointerup") requestRef.current(nextStep());
      return;
    }
    setDragging(false);
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const [vx, vy] = releaseVelocity(drag.samples, event.timeStamp);
    const distance = Math.hypot(dx, dy);
    const pace = Math.hypot(vx, vy);
    const flick = pace > FLICK_SPEED && distance > 16 && vx * dx + vy * dy > 0;
    if (event.type === "pointerup" && st.count > 1 && (distance > st.threshold || flick) && nextStep() > stepRef.current) {
      // кинули — картка летить туди, куди кинули, і стан теж переходить на наступну
      appliedRef.current += 1;
      sendToBack(pace > 300 ? [vx, vy] : [dx, dy], [vx, vy]);
      requestRef.current(nextStep());
    } else {
      placeAll({ released: drag.card, velocity: [clamp(vx, -3000, 3000), clamp(vy, -3000, 3000)] });
      if (event.type === "pointerup" && (distance > st.threshold || flick)) requestRef.current(nextStep());
    }
  };

  const onDown = (event: React.PointerEvent<HTMLElement>, index: number) => {
    if (event.button !== 0 || dragRef.current) return;
    if (orderRef.current[0] !== index || flyingRef.current.has(index)) return;
    const st = sRef.current;
    const v = valuesFor(index);
    const home = placement(0);
    const bounds = event.currentTarget.getBoundingClientRect();
    v.grabX.set(clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1));
    v.grabY.set(clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1));
    if (!st.reduceMotion) animate(v.lift, PRESS_SCALE, springFor("press"));
    dragRef.current = {
      card: index,
      id: event.pointerId,
      element: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      originX: 0,
      originY: 0,
      homeX: home.x,
      homeY: home.y,
      vx: 0,
      vy: 0,
      idle: undefined,
      moved: false,
      progress: 0,
      samples: [[event.clientX, event.clientY, event.timeStamp]],
    };
    if (event.pointerType === "mouse") event.preventDefault();
    window.addEventListener("pointermove", listeners.current.move);
    window.addEventListener("pointerup", listeners.current.up);
    window.addEventListener("pointercancel", listeners.current.up);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (["ArrowRight", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      requestRef.current(nextStep());
    } else if (event.key === "ArrowLeft" && stepRef.current > 0) {
      event.preventDefault();
      requestRef.current(stepRef.current - 1);
    }
  };

  const actions = useRef({ onMove, onUp });
  useLayoutEffect(() => {
    actions.current = { onMove, onUp };
  });
  const listeners = useRef({
    move: (e: PointerEvent) => actions.current.onMove(e),
    up: (e: PointerEvent) => actions.current.onUp(e),
  });

  useLayoutEffect(() => {
    orderRef.current = order;
    placeAll({ stagger: mountedRef.current ? 0 : 0.06 });
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, visible, spread, depth, count]);

  useEffect(() => {
    aliveRef.current = true;
    const l = listeners.current;
    return () => {
      aliveRef.current = false;
      clearTimeout(queueRef.current);
      queueRef.current = undefined;
      if (dragRef.current) clearTimeout(dragRef.current.idle);
      window.removeEventListener("pointermove", l.move);
      window.removeEventListener("pointerup", l.up);
      window.removeEventListener("pointercancel", l.up);
      values.forEach((group) => Object.values(group).forEach((value) => value.stop()));
    };
  }, [values]);

  const r = `calc(${radius} * var(--u))`;

  return (
    <div
      ref={rootRef}
      className={`relative outline-none focus-visible:[&_[data-top]_[data-face]]:outline-2 focus-visible:[&_[data-top]_[data-face]]:outline-offset-4 focus-visible:[&_[data-top]_[data-face]]:outline-paper ${className}`}
      style={style}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {cards.map((card, index) => {
        const v = values.get(index)!;
        const isTop = order[0] === index;
        return (
          <motion.div
            key={index}
            ref={(el: HTMLDivElement | null) => {
              if (el) elementsRef.current.set(index, el);
              else elementsRef.current.delete(index);
            }}
            data-top={isTop ? "" : undefined}
            aria-hidden={isTop ? undefined : true}
            aria-roledescription="slide"
            className="absolute inset-0 select-none [-webkit-tap-highlight-color:transparent] will-change-transform"
            style={{
              x: v.x,
              y: v.y,
              rotate: v.rotate,
              scale: v.scale,
              zIndex: v.z,
              opacity: v.opacity,
              originX: ORIGIN[0],
              originY: ORIGIN[1],
              cursor: isTop ? (dragging ? "grabbing" : "grab") : "default",
              touchAction: isTop ? "pan-y" : "auto",
            }}
            onPointerDown={(event) => onDown(event, index)}
          >
            <motion.div
              data-face=""
              className="absolute inset-0 overflow-hidden will-change-transform"
              style={{
                rotateX: v.tiltX,
                rotateY: v.tiltY,
                rotate: v.spin,
                scale: v.lift,
                originX: v.grabX,
                originY: v.grabY,
                transformPerspective: 800,
                borderRadius: r,
                boxShadow: SHADOW,
              }}
            >
              <div className="relative size-full overflow-hidden" style={{ borderRadius: r }}>
                {card}
              </div>
              <motion.div
                className="pointer-events-none absolute inset-0 bg-ink"
                style={{ opacity: v.shade, borderRadius: r }}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
