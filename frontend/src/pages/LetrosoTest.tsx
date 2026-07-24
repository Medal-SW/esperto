import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useState } from "react";
import { useLetrosoGame, useSubmitAttempt } from "../api/hooks";
import { Keyboard } from "../components/letroso/Keyboard";

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

const CHAR_SIZE = "min(8.5vw, 42px)";
const GAP_SIZE = "min(1.5vw, 6px)";
const FONT_SIZE = "min(5vw, 22px)";
const MAX_INPUT = 10;

const charStyle: React.CSSProperties = {
  width: CHAR_SIZE,
  height: CHAR_SIZE,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: FONT_SIZE,
  fontWeight: "bold",
  textTransform: "uppercase",
  padding: 0,
  margin: 0,
};

export default function LetrosoBoard() {
  const queryClient = useQueryClient();
  const { data: gameState } = useLetrosoGame();
  const { mutate: submitAttempt, isPending } = useSubmitAttempt();

  const [currentGuess, setCurrentGuess] = useState("");
  const [cursorIndex, setCursorIndex] = useState(0);

  const handleSubmit = () => {
    submitAttempt(currentGuess, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["letroso", "today"] });
        setCurrentGuess("");
        setCursorIndex(0);
      },
    });
  };

  const handleKey = useCallback(
    (key: string) => {
      if (key === "ENTER") {
        handleSubmit();
      } else if (key === "⌫") {
        setCurrentGuess(
          (prev) => prev.slice(0, cursorIndex - 1) + prev.slice(cursorIndex),
        );
        setCursorIndex((prev) => prev - 1);
      } else if (key === "←") {
        setCursorIndex((prev) => Math.max(0, prev - 1));
      } else if (key === "→") {
        setCursorIndex((prev) => Math.min(currentGuess.length, prev + 1));
      } else if (/^[A-Z]$/.test(key)) {
        if (currentGuess.length < MAX_INPUT) {
          setCurrentGuess(
            (prev) =>
              prev.slice(0, cursorIndex) +
              key.toLowerCase() +
              prev.slice(cursorIndex),
          );
          setCursorIndex((prev) => prev + 1);
        }
      }
    },
    [gameState?.solved, handleSubmit],
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

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "system-ui",
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const boardScrollAreaStyle: React.CSSProperties = {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowY: "auto",
    padding: "0 16px",
    minHeight: 0,
  };

  const boardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
    maxWidth: "500px",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: GAP_SIZE,
    height: CHAR_SIZE,
  };

  const successMessageStyle: React.CSSProperties = {
    marginTop: "32px",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#16a34a",
    textAlign: "center",
  };

  const keyboardArea: React.CSSProperties = {
    width: "100%",
    maxWidth: "500px",
    marginTop: "auto",
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          marginBottom: "32px",
          fontSize: "24px",
          fontFamily: "system-ui",
          fontWeight: "bold",
        }}
      >
        LETROSO
      </div>
      <div style={boardScrollAreaStyle}>
        <div style={boardStyle}>
          {gameState?.guesses.map((entry, rowIndex) => (
            <div key={rowIndex} style={rowStyle}>
              {entry.feedback.map((block, blockIndex) => (
                <FeedbackBlock key={blockIndex} guess={block} />
              ))}
            </div>
          ))}

          {!gameState?.solved && currentGuess.length > 0 && (
            <div style={rowStyle}>
              {currentGuess.split("").map((char, i) => (
                <div key={i} style={charStyle}>
                  {char}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {gameState?.solved && (
        <div style={successMessageStyle}>
          Parabéns! Você resolveu o Letroso.
        </div>
      )}

      <div style={keyboardArea}>
        <Keyboard onKey={handleKey} disabled={isPending} />
      </div>
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
    borderTopLeftRadius: guess.is_start ? "24px" : "6px",
    borderBottomLeftRadius: guess.is_start ? "24px" : "6px",
    borderTopRightRadius: guess.is_end ? "24px" : "6px",
    borderBottomRightRadius: guess.is_end ? "24px" : "6px",
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
