/*
 * Підпис у квадратних дужках, як у меню: [MOLECULA     ] або [    GET IN TOUCH ].
 * DM Mono моноширинний, тож пробіли-відступи вирівнюють дужки в стовпчик. Літери перекидаються (LetterSwap)
 * при наведенні на батька з класом letter-swap-trigger.
 */

import { LetterSwap } from "./LetterSwap";

type Props = { label: string; before?: number; after?: number };

export function BracketLabel({ label, before = 0, after = 0 }: Props) {
  return (
    <>
      <span aria-hidden="true" className="whitespace-pre">
        [{" ".repeat(before)}
      </span>
      <LetterSwap text={label} />
      <span aria-hidden="true" className="whitespace-pre">
        {" ".repeat(after)}]
      </span>
    </>
  );
}
