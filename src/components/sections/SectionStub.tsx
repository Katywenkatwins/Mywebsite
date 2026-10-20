// Тимчасова заглушка секції: дає якір для меню, поки секція не зверстана.
type Props = { id: string; title: string };

export function SectionStub({ id, title }: Props) {
  return (
    <section
      id={id}
      aria-label={title}
      className="flex min-h-[50svh] items-center justify-center border-t border-ink/10 bg-paper"
    >
      <p className="text-u-14 uppercase tracking-[calc(-0.28*var(--u))] text-ink/40">{title} — скоро</p>
    </section>
  );
}
