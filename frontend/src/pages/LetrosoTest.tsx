import React, { useEffect, useState } from "react";
import { useSubmitAttempt } from "../api/hooks";

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
  solved: boolean;
}

export function LetrosoTest() {
  const attemptMutation = useSubmitAttempt();

  // 1. BLINDAGEM DO ESTADO: Garantimos que NUNCA será undefined
  const [guesses, setGuesses] = useState<GuessEntry[]>(() => {
    try {
      const saved = localStorage.getItem("letroso_test_guesses");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garante que se o JSON for inválido ou não for array, retorna array vazio
        return Array.isArray(parsed)
          ? (parsed as GuessEntry[])
          : ([] as GuessEntry[]);
      }
    } catch (e) {
      console.error("Erro no LocalStorage", e);
    }
    return [] as GuessEntry[];
  });

  const [currentInput, setCurrentInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 2. BLINDAGEM DE LEITURA: Fallback seguro caso o estado se perca
  const safeGuesses: GuessEntry[] = guesses || ([] as GuessEntry[]);

  // Verificação segura do status de vitória
  const solved: boolean =
    safeGuesses.length > 0
      ? Boolean(safeGuesses[safeGuesses.length - 1]?.solved)
      : false;

  useEffect(() => {
    localStorage.setItem("letroso_test_guesses", JSON.stringify(safeGuesses));
  }, [safeGuesses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    setErrorMsg("");

    try {
      // 3. BLINDAGEM DA MUTATION: Forçamos o TypeScript a entender o formato do retorno
      const response = (await attemptMutation.mutateAsync(
        currentInput,
      )) as unknown as GuessEntry;

      if (!response || !response.feedback) {
        throw new Error("Resposta inválida do servidor");
      }

      setGuesses((prev) => [...(prev || []), response]);
      setCurrentInput("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(detail || "Erro ao comunicar com o backend.");
    }
  };

  const handleReset = () => {
    setGuesses([] as GuessEntry[]);
    setCurrentInput("");
    setErrorMsg("");
    localStorage.removeItem("letroso_test_guesses");
  };

  const getTileColor = (correct_order: boolean, exists: boolean) => {
    if (correct_order) return "#4caf50";
    if (exists) return "#ffeb3b";
    return "#e0e0e0";
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "40px auto",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Teste Isolado (LocalStorage)</h2>
        <button
          onClick={handleReset}
          type="button"
          style={{
            padding: "6px 12px",
            cursor: "pointer",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Resetar Jogo
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "24px",
          marginTop: "20px",
        }}
      >
        {safeGuesses.map((entry, index) => {
          const tiles: React.ReactNode[] = [];

          // 4. BLINDAGEM DO FEEDBACK: Previne erro se o backend não mandar o array
          const safeFeedback = entry?.feedback || [];

          safeFeedback.forEach((block, blockIndex) => {
            const bgColor = getTileColor(
              Boolean(block?.correct_order),
              Boolean(block?.exists),
            );
            const textColor =
              block?.correct_order || !block?.exists ? "white" : "black";

            // 5. BLINDAGEM DA STRING: Previne erro de length em undefined
            const safeSubstring = block?.substring || "";

            for (let i = 0; i < safeSubstring.length; i++) {
              tiles.push(
                <div
                  key={`${index}-${blockIndex}-${i}`}
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: bgColor,
                    color: textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "20px",
                    textTransform: "uppercase",
                    borderRadius: "4px",
                  }}
                >
                  {safeSubstring[i]}
                </div>,
              );
            }
          });

          return (
            <div
              key={index}
              style={{ display: "flex", gap: "6px", justifyContent: "center" }}
            >
              {tiles}
            </div>
          );
        })}
      </div>

      {!solved ? (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value.toUpperCase())}
            disabled={attemptMutation.isPending}
            placeholder="Digite uma palavra..."
            style={{
              padding: "12px",
              textTransform: "uppercase",
              fontSize: "16px",
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={attemptMutation.isPending || !currentInput}
            style={{
              padding: "12px",
              cursor: "pointer",
              fontSize: "16px",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {attemptMutation.isPending ? "Processando..." : "Enviar Tentativa"}
          </button>
        </form>
      ) : (
        <h3 style={{ color: "green", textAlign: "center" }}>Você venceu! 🎉</h3>
      )}

      {errorMsg && (
        <div
          style={{
            marginTop: "12px",
            color: "red",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}
