import type { LetterState } from "../../types";
import styles from "./LetterTile.module.css";

interface LetterTileProps {
  letter?: string;
  state?: LetterState;
  position?: number;
  wordLength?: number;
  isCurrent?: boolean;
}

export function LetterTile({
  letter,
  state,
  position,
  wordLength,
  isCurrent,
}: LetterTileProps) {
  let className = styles.tile;

  if (state === "correct") {
    const isEdge =
      position === 0 || (wordLength !== undefined && position === wordLength - 1);
    className += " " + (isEdge ? styles.correctEdge : styles.correct);
  } else if (state === "present") {
    className += " " + styles.present;
  } else if (state === "absent") {
    className += " " + styles.absent;
  } else if (isCurrent) {
    className += " " + styles.current;
  } else {
    className += " " + styles.empty;
  }

  return <div className={className}>{letter ?? ""}</div>;
}
