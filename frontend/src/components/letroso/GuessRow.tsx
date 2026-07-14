import type { GuessEntry } from "../../types";
import { LetterTile } from "./LetterTile";
import styles from "./GuessRow.module.css";

interface GuessRowProps {
  entry?: GuessEntry;
  currentInput?: string;
  cursorPos?: number;
  onTileClick?: (pos: number) => void;
}

export function GuessRow({ entry, currentInput, cursorPos, onTileClick }: GuessRowProps) {
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
  const pos = cursorPos ?? letters.length;
  const tiles: React.ReactNode[] = [];

  for (let i = 0; i <= letters.length; i++) {
    if (i === pos) {
      tiles.push(<div key="cursor" className={styles.cursor} />);
    }
    if (i < letters.length) {
      const idx = i;
      tiles.push(
        <LetterTile
          key={`letter-${i}`}
          letter={letters[i]}
          isCurrent
          onClick={() => onTileClick?.(idx + 1)}
        />
      );
    }
  }

  return <div className={styles.row}>{tiles}</div>;
}
