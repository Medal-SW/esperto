import type { GuessEntry } from "../../types";
import { LetterTile } from "./LetterTile";
import styles from "./GuessRow.module.css";

interface GuessRowProps {
  entry?: GuessEntry;
  currentInput?: string;
}

export function GuessRow({ entry, currentInput }: GuessRowProps) {
  if (entry) {
    return (
      <div className={styles.row}>
        {entry.feedback.map((f, i) => (
          <LetterTile
            key={i}
            letter={f.letter}
            state={f.state}
            edgeStart={f.edge_start}
            edgeEnd={f.edge_end}
          />
        ))}
      </div>
    );
  }

  const letters = (currentInput ?? "").split("");
  return (
    <div className={styles.row}>
      {letters.map((ch, i) => (
        <LetterTile key={i} letter={ch} isCurrent />
      ))}
      <LetterTile key="cursor" isCurrent />
    </div>
  );
}
