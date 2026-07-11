import type { GuessEntry } from "../../types";
import { LetterTile } from "./LetterTile";
import styles from "./GuessRow.module.css";

interface GuessRowProps {
  entry?: GuessEntry;
  currentInput?: string;
}

export function GuessRow({ entry, currentInput }: GuessRowProps) {
  if (entry) {
    const total = entry.feedback.length;
    return (
      <div className={styles.row}>
        {entry.feedback.map((f, i) => (
          <LetterTile
            key={i}
            letter={f.letter}
            state={f.state}
            isFirst={i === 0}
            isLast={i === total - 1}
            prevCorrect={i > 0 && entry.feedback[i - 1]?.state === "correct"}
            nextCorrect={i < total - 1 && entry.feedback[i + 1]?.state === "correct"}
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
