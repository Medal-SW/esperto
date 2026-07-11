import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Equal, Search } from "lucide-react";
import { useHistoricoEventos, useHistoricoGame, useHistoricoGuess } from "../api/hooks";
import { Confetti } from "../components/Confetti";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import type { HistoricoEra, HistoricoEventOption, HistoricoGuessEntry } from "../types";
import styles from "./Historico.module.css";

const ERA_META: Record<HistoricoEra, { label: string; color: string; min: number; max: number; width: number }> = {
  antiga: { label: "Antiga", color: "#eab308", min: -3500, max: 476, width: 16 },
  media: { label: "Idade Média", color: "#a855f7", min: 477, max: 1452, width: 18 },
  moderna: { label: "Moderna", color: "#14b8a6", min: 1453, max: 1788, width: 18 },
  contemporanea: { label: "Contemporânea", color: "#f43f5e", min: 1789, max: 1945, width: 26 },
  atual: { label: "Pós-1945", color: "#3b82f6", min: 1946, max: 2026, width: 22 },
};

const ERA_ORDER: HistoricoEra[] = ["antiga", "media", "moderna", "contemporanea", "atual"];
const MIN_YEAR = ERA_META.antiga.min;
const MAX_YEAR = ERA_META.atual.max;

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function formatYear(year: number): string {
  return year < 0 ? `${-year} a.C.` : `${year}`;
}

function yearToPercent(year: number): number {
  const y = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
  let start = 0;
  for (const era of ERA_ORDER) {
    const meta = ERA_META[era];
    if (y <= meta.max) {
      return start + ((y - meta.min) / (meta.max - meta.min)) * meta.width;
    }
    start += meta.width;
  }
  return 100;
}

function computeWindow(guesses: HistoricoGuessEntry[]): { lo: number; hi: number } {
  let lo = MIN_YEAR;
  let hi = MAX_YEAR;
  for (const g of guesses) {
    if (g.direction === "depois" && g.year > lo) lo = g.year;
    if (g.direction === "antes" && g.year < hi) hi = g.year;
    if (g.direction === "mesmo_ano") {
      lo = g.year;
      hi = g.year;
    }
  }
  return { lo, hi };
}

function DirectionBadge({ direction }: { direction: HistoricoGuessEntry["direction"] }) {
  if (direction === "acertou") {
    return (
      <span className={`${styles.badge} ${styles.badgeAcertou}`}>
        <Check size={12} /> acertou
      </span>
    );
  }
  if (direction === "antes") {
    return (
      <span className={`${styles.badge} ${styles.badgeAntes}`}>
        <ArrowLeft size={12} /> antes
      </span>
    );
  }
  if (direction === "mesmo_ano") {
    return (
      <span className={`${styles.badge} ${styles.badgeMesmoAno}`}>
        <Equal size={12} /> mesmo ano
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeDepois}`}>
      depois <ArrowRight size={12} />
    </span>
  );
}

export function HistoricoPage() {
  const { data: game, isLoading } = useHistoricoGame();
  const { data: eventos } = useHistoricoEventos();
  const guessMutation = useHistoricoGuess();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const solved = game?.solved ?? false;
  const guesses = game?.guesses ?? [];

  useEffect(() => {
    if (game?.solved && guesses.length > 0) {
      setShowConfetti(true);
    }
  }, [game?.solved]);

  const guessedIds = useMemo(
    () => new Set(guesses.map((g) => g.event_id)),
    [guesses]
  );

  const suggestions = useMemo(() => {
    if (!eventos || query.trim().length < 2) return [];
    const q = normalize(query.trim());
    return eventos
      .filter((e) => !guessedIds.has(e.id) && normalize(e.name).includes(q))
      .slice(0, 8);
  }, [eventos, query, guessedIds]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  const { lo, hi } = computeWindow(guesses);
  const windowLeft = yearToPercent(lo);
  const windowWidth = Math.max(yearToPercent(hi) - windowLeft, 0.8);

  const handleSelect = async (event: HistoricoEventOption) => {
    setQuery("");
    try {
      const result = await guessMutation.mutateAsync(event.id);
      if (result.solved) {
        setShowConfetti(true);
      }
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      addToast(detail || "Erro ao enviar tentativa", "error");
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[highlighted];
      if (chosen) handleSelect(chosen);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton width={180} height={24} radius={8} />
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={280} height={40} radius={8} />
          <Skeleton width={280} height={12} radius={6} />
          <Skeleton width={280} height={40} radius={8} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Confetti active={showConfetti} />

      <div className={styles.header}>
        <div className={styles.title}>Histórico</div>
        <div className={styles.subtitle}>
          {solved
            ? `Resolvido em ${game?.attempts} tentativa${game?.attempts === 1 ? "" : "s"}`
            : guesses.length === 0
              ? "Adivinhe o evento histórico do dia"
              : `Tentativa ${guesses.length + 1}`}
        </div>
      </div>

      {!solved && (
        <div className={styles.searchArea}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder="Digite um evento histórico..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={guessMutation.isPending}
              autoFocus
            />
          </div>
          {suggestions.length > 0 && (
            <div className={styles.dropdown}>
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  className={`${styles.option} ${i === highlighted ? styles.optionActive : ""}`}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => handleSelect(s)}
                >
                  <span className={styles.optionName}>{s.name}</span>
                  <span
                    className={styles.eraChip}
                    style={{
                      color: ERA_META[s.era].color,
                      background: `${ERA_META[s.era].color}22`,
                    }}
                  >
                    {ERA_META[s.era].label}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className={styles.hint}>A cor indica a era do evento. Sem limite de tentativas.</p>
        </div>
      )}

      <div className={styles.timelineArea}>
        <div className={styles.timeline}>
          {ERA_ORDER.map((era) => (
            <div
              key={era}
              className={styles.timelineSegment}
              style={{ width: `${ERA_META[era].width}%`, background: `${ERA_META[era].color}44` }}
            />
          ))}
          {!solved && guesses.length > 0 && (
            <div
              className={styles.timelineWindow}
              style={{ left: `${windowLeft}%`, width: `${windowWidth}%` }}
            />
          )}
          {guesses.map((g) => (
            <div
              key={g.event_id}
              className={`${styles.timelineMark} ${g.direction === "acertou" ? styles.timelineMarkHit : ""}`}
              style={{ left: `${yearToPercent(g.year)}%` }}
              title={`${g.name} (${formatYear(g.year)})`}
            />
          ))}
        </div>
        <div className={styles.timelineLabels}>
          {ERA_ORDER.map((era) => (
            <span key={era} style={{ width: `${ERA_META[era].width}%`, color: ERA_META[era].color }}>
              {ERA_META[era].label}
            </span>
          ))}
        </div>
        {!solved && guesses.length > 0 && (
          <p className={styles.windowHint}>
            {lo === hi
              ? `O evento secreto aconteceu em ${formatYear(lo)}`
              : `O evento secreto está entre ${formatYear(lo)} e ${formatYear(hi)}`}
          </p>
        )}
      </div>

      <div className={styles.guessList} ref={listRef}>
        {guesses.map((g, i) => (
          <div key={i} className={styles.guessRow}>
            <span className={styles.guessYear}>{formatYear(g.year)}</span>
            <span className={styles.guessName}>{g.name}</span>
            <DirectionBadge direction={g.direction} />
          </div>
        ))}
      </div>

      {solved && game?.target && (
        <div className={styles.successBox}>
          <div className={styles.successTitle}>
            <Check size={18} /> Você acertou!
          </div>
          <p className={styles.successEvent}>
            {game.target.name} <span className={styles.successYear}>({formatYear(game.target.year)})</span>
          </p>
          <p className={styles.successMeta}>
            {game.attempts} tentativa{game.attempts === 1 ? "" : "s"} — volte amanhã para um novo evento.
          </p>
        </div>
      )}
    </div>
  );
}
