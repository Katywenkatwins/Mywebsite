/*
 * 3D-перекидання літер при наведенні (у дусі «3D Letter Swap» з React Bits Pro,
 * власна реалізація на CSS — без ліцензії Pro і без JS).
 * Літери — кубики: при наведенні на батьківський елемент з класом `letter-swap-trigger`
 * кожен кубик повертається по осі X і показує ту саму літеру з іншої грані, з затримкою по черзі.
 * Скрінрідер читає звичайний текст.
 */
import "./LetterSwap.css";

type Props = { text: string; className?: string };

export function LetterSwap({ text, className }: Props) {
  return (
    <span className={`letter-swap ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="letter-swap-row">
        {Array.from(text).map((ch, i) => (
          <span key={i} className="letter-swap-cube" style={{ "--i": i } as React.CSSProperties}>
            <span className="letter-swap-face">{ch === " " ? " " : ch}</span>
            <span className="letter-swap-face letter-swap-back">{ch === " " ? " " : ch}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
