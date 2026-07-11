import type { LetterState } from "../../types";
import styles from "./LetterTile.module.css";

interface LetterTileProps {
  letter?: string;
  state?: LetterState;
  edgeStart?: boolean;
  edgeEnd?: boolean;
  isCurrent?: boolean;
}

export function LetterTile({
  letter,
  state,
  edgeStart,
  edgeEnd,
  isCurrent,
}: LetterTileProps) {
  let className = styles.tile;

  if (state === "correct") {
    if (edgeStart && edgeEnd) {
      className += " " + styles.correctPill;
    } else if (edgeStart) {
      className += " " + styles.correctEdgeStart;
    } else if (edgeEnd) {
      className += " " + styles.correctEdgeEnd;
    } else {
      className += " " + styles.correct;
    }
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
