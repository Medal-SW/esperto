import { useCallback, useEffect, useRef, useState } from "react";
import { useLetrosoGame, useSubmitGuess } from "../api/hooks";
import { Confetti } from "../components/Confetti";
import { GuessRow } from "../components/letroso/GuessRow";
import { Keyboard } from "../components/letroso/Keyboard";
import { SuccessScreen } from "../components/letroso/SuccessScreen";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import styles from "./Play.module.css";

const MAX_INPUT = 10;

interface InputState {
  text: string;
  cursor: number;
}

const EMPTY_INPUT: InputState = { text: "", cursor: 0 };

export function PlayPage() {
  const { data: game, isLoading } = useLetrosoGame();
  const guessMutation = useSubmitGuess();
  const { addToast } = useToast();

  const [input, setInput] = useState<InputState>(EMPTY_INPUT);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  const solved = game?.solved ?? false;
  const guesses = game?.guesses ?? [];

  useEffect(() => {
    if (game?.solved && guesses.length > 0) {
      setShowConfetti(true);
    }
  }, [game?.solved]);

  const handleSubmit = useCallback(async () => {
    const current = inputRef.current.text;
    if (current.length === 0) return;
    setError("");

    try {
      const result = await guessMutation.mutateAsync(current);
      setInput(EMPTY_INPUT);
      if (result.solved) {
        setShowConfetti(true);
      }
      setTimeout(() => {
        boardRef.current?.scrollTo({ top: boardRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else {
        addToast("Erro ao enviar tentativa", "error");
      }
    }
  }, [guessMutation, addToast]);

  const handleKey = useCallback(
    (key: string) => {
      if (solved) return;
      setError("");

      if (key === "ENTER") {
        handleSubmit();
      } else if (key === "⌫") {
        setInput((prev) =>
          prev.cursor > 0
            ? {
                text: prev.text.slice(0, prev.cursor - 1) + prev.text.slice(prev.cursor),
                cursor: prev.cursor - 1,
              }
            : prev
        );
      } else if (key === "←") {
        setInput((prev) => ({ ...prev, cursor: Math.max(0, prev.cursor - 1) }));
      } else if (key === "→") {
        setInput((prev) => ({ ...prev, cursor: Math.min(prev.text.length, prev.cursor + 1) }));
      } else if (/^[A-Z]$/.test(key)) {
        setInput((prev) =>
          prev.text.length < MAX_INPUT
            ? {
                text: prev.text.slice(0, prev.cursor) + key.toLowerCase() + prev.text.slice(prev.cursor),
                cursor: prev.cursor + 1,
              }
            : prev
        );
      }
    },
    [solved, handleSubmit]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        e.preventDefault();
        handleKey("ENTER");
      } else if (key === "BACKSPACE") {
        e.preventDefault();
        handleKey("⌫");
      } else if (key === "ARROWLEFT") {
        e.preventDefault();
        handleKey("←");
      } else if (key === "ARROWRIGHT") {
        e.preventDefault();
        handleKey("→");
      } else if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        handleKey(key);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton width={180} height={24} radius={8} />
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={220} height={40} radius={8} />
          <Skeleton width={220} height={40} radius={8} />
          <Skeleton width={220} height={40} radius={8} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Confetti active={showConfetti} />

      <div className={styles.header}>
        <div className={styles.title}>Letroso</div>
        <div className={styles.subtitle}>
          {solved
            ? `Resolvido em ${game?.attempts} tentativa${game?.attempts === 1 ? "" : "s"}`
            : `Tentativa ${guesses.length + 1}`}
        </div>
      </div>

      <div className={styles.board} ref={boardRef}>
        {guesses.map((entry, i) => (
          <GuessRow key={i} entry={entry} />
        ))}
        {!solved && (
          <GuessRow
            currentInput={input.text}
            cursorPos={input.cursor}
            onTileClick={(pos) => setInput((prev) => ({ ...prev, cursor: pos }))}
          />
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {solved && game?.attempts ? (
        <SuccessScreen attempts={game.attempts} />
      ) : (
        <div className={styles.keyboardArea}>
          <Keyboard
            guesses={guesses}
            onKey={handleKey}
            disabled={guessMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
