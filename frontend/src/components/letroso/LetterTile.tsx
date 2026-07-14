import type { CSSProperties } from "react";
import type { LetterState } from "../../types";
import styles from "./LetterTile.module.css";

interface LetterTileProps {
  letter?: string;
  state?: LetterState;
  isFirst?: boolean;
  isLast?: boolean;
  prevCorrect?: boolean;
  nextCorrect?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
}

export function LetterTile({
  letter,
  state,
  isFirst,
  isLast,
  prevCorrect,
  nextCorrect,
  isCurrent,
  onClick,
}: LetterTileProps) {
  let className = styles.tile;
  const inlineStyle: CSSProperties = {};

  if (state === "correct") {
    className += " " + styles.correct;
    if (prevCorrect) {
      className += " " + styles.grouped;
    }
    const tl = isFirst ? "var(--radius-full)" : prevCorrect ? "0" : "var(--radius-sm)";
    const tr = isLast ? "var(--radius-full)" : nextCorrect ? "0" : "var(--radius-sm)";
    const br = isLast ? "var(--radius-full)" : nextCorrect ? "0" : "var(--radius-sm)";
    const bl = isFirst ? "var(--radius-full)" : prevCorrect ? "0" : "var(--radius-sm)";
    inlineStyle.borderRadius = `${tl} ${tr} ${br} ${bl}`;
  } else if (state === "present") {
    className += " " + styles.present;
  } else if (state === "absent") {
    className += " " + styles.absent;
  } else if (isCurrent) {
    className += " " + styles.current;
    if (onClick) {
      className += " " + styles.clickable;
    }
  } else {
    className += " " + styles.empty;
  }

  return (
    <div className={className} style={inlineStyle} onClick={onClick}>
      {letter ?? ""}
    </div>
  );
}
