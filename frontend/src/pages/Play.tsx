import { useCallback, useEffect, useRef, useState } from "react";
import { useLetrosoGame, useSubmitGuess } from "../api/hooks";
import { Confetti } from "../components/Confetti";
import { GuessRow } from "../components/letroso/GuessRow";
import { Keyboard } from "../components/letroso/Keyboard";
import { SuccessScreen } from "../components/letroso/SuccessScreen";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import styles from "./Play.module.css";

export function PlayPage() {
  const { data: game, isLoading } = useLetrosoGame();
  const guessMutation = useSubmitGuess();
  const { addToast } = useToast();

  const [currentInput, setCurrentInput] = useState("");
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const wordLength = game?.word_length ?? 0;
  const solved = game?.solved ?? false;
  const guesses = game?.guesses ?? [];

  useEffect(() => {
    if (game?.solved && guesses.length > 0) {
      setShowConfetti(true);
    }
  }, [game?.solved]);

  const handleSubmit = useCallback(async () => {
    if (!wordLength || currentInput.length !== wordLength) return;
    setError("");

    try {
      const result = await guessMutation.mutateAsync(currentInput);
      setCurrentInput("");
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
  }, [currentInput, wordLength, guessMutation, addToast]);

  const handleKey = useCallback(
    (key: string) => {
      if (solved) return;
      setError("");

      if (key === "ENTER") {
        handleSubmit();
      } else if (key === "⌫") {
        setCurrentInput((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentInput.length < wordLength) {
        setCurrentInput((prev) => prev + key.toLowerCase());
      }
    },
    [solved, handleSubmit, currentInput.length, wordLength]
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
            : `${wordLength} letras · Tentativa ${guesses.length + 1}`}
        </div>
      </div>

      <div className={styles.board} ref={boardRef}>
        {guesses.map((entry, i) => (
          <GuessRow key={i} entry={entry} wordLength={wordLength} />
        ))}
        {!solved && (
          <GuessRow currentInput={currentInput} wordLength={wordLength} />
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
