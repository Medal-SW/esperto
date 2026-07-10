import type { GuessEntry } from "../../types";
import { LetterTile } from "./LetterTile";
import styles from "./GuessRow.module.css";

interface GuessRowProps {
  entry?: GuessEntry;
  currentInput?: string;
  wordLength: number;
}

export function GuessRow({ entry, currentInput, wordLength }: GuessRowProps) {
  if (entry) {
    return (
      <div className={styles.row}>
        {entry.feedback.map((f, i) => (
          <LetterTile
            key={i}
            letter={f.letter}
            state={f.state}
            position={f.position}
            wordLength={wordLength}
          />
        ))}
      </div>
    );
  }

  const letters = (currentInput ?? "").split("");
  return (
    <div className={styles.row}>
      {Array.from({ length: wordLength }, (_, i) => (
        <LetterTile
          key={i}
          letter={letters[i]}
          isCurrent={i <= letters.length}
        />
      ))}
    </div>
  );
}
