import styles from "./Keyboard.module.css";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

interface KeyboardProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

export function Keyboard({ onKey, disabled }: KeyboardProps) {
  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={styles.row}>
          {row.map((key) => {
            const isWide = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                className={`${isWide ? styles.wideKey : styles.key}`}
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
