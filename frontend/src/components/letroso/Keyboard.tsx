import type { LetterState, GuessEntry } from "../../types";
import styles from "./Keyboard.module.css";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const STATE_PRIORITY: Record<LetterState, number> = {
  correct: 3,
  present: 2,
  absent: 1,
};

function buildKeyStates(guesses: GuessEntry[]): Record<string, LetterState> {
  const states: Record<string, LetterState> = {};
  for (const entry of guesses) {
    for (const fb of entry.feedback) {
      const key = fb.letter.toUpperCase();
      const existing = states[key];
      if (!existing || STATE_PRIORITY[fb.state] > STATE_PRIORITY[existing]) {
        states[key] = fb.state;
      }
    }
  }
  return states;
}

interface KeyboardProps {
  guesses: GuessEntry[];
  onKey: (key: string) => void;
  disabled?: boolean;
}

export function Keyboard({ guesses, onKey, disabled }: KeyboardProps) {
  const keyStates = buildKeyStates(guesses);

  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={styles.row}>
          {row.map((key) => {
            const isWide = key === "ENTER" || key === "⌫";
            const state = keyStates[key];
            let stateClass = "";
            if (state === "correct") stateClass = styles.correct ?? "";
            else if (state === "present") stateClass = styles.present ?? "";
            else if (state === "absent") stateClass = styles.absent ?? "";

            return (
              <button
                key={key}
                className={`${isWide ? styles.wideKey : styles.key} ${stateClass}`}
                onClick={() => !disabled && onKey(key)}
                disabled={disabled}
                type="button"
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
