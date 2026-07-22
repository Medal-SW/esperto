import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useLetrosoGame, useSubmitAttempt } from "../api/hooks";

export interface Guess {
  substring: string;
  exists: boolean;
  correct_order: boolean;
  is_start: boolean;
  is_end: boolean;
}

export interface GuessEntry {
  guess: string;
  feedback: Guess[];
}

export interface GameStateResponse {
  guesses: GuessEntry[];
  solved: boolean;
  attempts: number | null;
}

export interface GuessFinalResponse {
  guess: string;
  feedback: Guess[];
  solved: boolean;
  game_state: GameStateResponse;
}

export default function LetrosoBoard() {
  const queryClient = useQueryClient();
  const { data: gameState } = useLetrosoGame();
  const { mutate: submitAttempt, isPending } = useSubmitAttempt();

  const [currentGuess, setCurrentGuess] = useState("");

  const [cursorIndex, setCursorIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    setCursorVisible(true);
    const interval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, [cursorIndex, currentGuess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState?.solved || isPending) return;

      if (e.key === "Enter") {
        if (currentGuess.trim().length > 0) {
          submitAttempt(currentGuess, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["letroso", "today"] });
              setCurrentGuess("");
              setCursorIndex(0); // <-- ADICIONADO: reseta o cursor
            },
          });
        }
      } else if (e.key === "Backspace") {
        // --- MODIFICADO: apaga na posição do cursor ---
        if (cursorIndex > 0) {
          setCurrentGuess(
            (prev) => prev.slice(0, cursorIndex - 1) + prev.slice(cursorIndex),
          );
          setCursorIndex((prev) => prev - 1);
        }
      } else if (e.key === "ArrowLeft") {
        // --- ADICIONADO: move para esquerda ---
        setCursorIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        // --- ADICIONADO: move para direita ---
        setCursorIndex((prev) => Math.min(currentGuess.length, prev + 1));
      } else if (/^[a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]$/.test(e.key)) {
        // --- MODIFICADO: insere na posição do cursor ---
        setCurrentGuess(
          (prev) =>
            prev.slice(0, cursorIndex) +
            e.key.toLowerCase() +
            prev.slice(cursorIndex),
        );
        setCursorIndex((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentGuess,
    cursorIndex,
    gameState?.solved,
    isPending,
    submitAttempt,
    queryClient,
  ]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "16px",
    fontFamily: "sans-serif",
  };

  const boardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    height: "48px",
  };

  const rowStyleTyping: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "48px",
    position: "relative",
    cursor: "text",
    minWidth: "2px",
  };

  const typingBlockStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#ffffff",
    boxSizing: "border-box",
  };

  const successMessageStyle: React.CSSProperties = {
    marginTop: "32px",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#16a34a",
  };

  return (
    <div style={containerStyle}>
      <div style={boardStyle}>
        {gameState?.guesses.map((entry, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {entry.feedback.map((block, blockIndex) => (
              <FeedbackBlock key={blockIndex} guess={block} />
            ))}
          </div>
        ))}

        {!gameState?.solved && currentGuess.length > 0 && (
          <div
            style={rowStyle}
            onClick={() => setCursorIndex(currentGuess.length)}
          >
            {currentGuess.split("").map((char, i) => (
              <div
                key={i}
                style={typingBlockStyle}
                // --- ADICIONADO: onClick na letra com cálculo de metade ---
                onClick={(e) => {
                  e.stopPropagation();
                  const isRightHalf = e.nativeEvent.offsetX > 28;
                  setCursorIndex(isRightHalf ? i + 1 : i);
                }}
              >
                {char}
              </div>
            ))}

            <div
              style={{
                position: "absolute",
                width: "8px",
                height: "40px",
                backgroundColor: "#000",
                top: "8px",
                left: `${currentGuess.length === 0 ? 0 : cursorIndex * 60 - 2}px`,
                opacity: cursorVisible ? 1 : 0,
                transition: "left 0.1s ease-out",
                pointerEvents: "none",
              }}
            />
          </div>
        )}
      </div>

      {gameState?.solved && (
        <div style={successMessageStyle}>
          Parabéns! Você resolveu o Letroso.
        </div>
      )}
    </div>
  );
}

function FeedbackBlock({ guess }: { guess: Guess }) {
  let bgColor = "#1e3347";
  if (guess.correct_order) {
    bgColor = "#22c55e";
  } else if (guess.exists) {
    bgColor = "#eab308";
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    backgroundColor: bgColor,
    color: "#FFFFFF",
    overflow: "hidden",
    borderRadius: "6px",
    borderTopLeftRadius: guess.is_start ? "24px" : "6px",
    borderBottomLeftRadius: guess.is_start ? "24px" : "6px",
    borderTopRightRadius: guess.is_end ? "24px" : "6px",
    borderBottomRightRadius: guess.is_end ? "24px" : "6px",
  };

  const charStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    textTransform: "uppercase",
  };

  return (
    <div style={containerStyle}>
      {guess.substring.split("").map((char, i) => (
        <div key={i} style={charStyle}>
          {char}
        </div>
      ))}
    </div>
  );
}
