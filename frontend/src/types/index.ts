export enum GameName {
  CONEXO = "conexo",
  LETROSO = "letroso",
  EXPRESSO = "expresso",
  HISTORICO = "historico",
}

export const GAME_META: Record<
  GameName,
  { name: string; color: string }
> = {
  [GameName.CONEXO]: { name: "Conexo", color: "#a855f7" },
  [GameName.LETROSO]: { name: "Letroso", color: "#22c55e" },
  [GameName.EXPRESSO]: { name: "Expresso", color: "#f59e0b" },
  [GameName.HISTORICO]: { name: "Histórico", color: "#3b82f6" },
};

export const ALL_GAMES = [
  GameName.CONEXO,
  GameName.LETROSO,
  GameName.EXPRESSO,
  GameName.HISTORICO,
];

export interface User {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  email: string | null;
  google_linked: boolean;
  has_password: boolean;
  is_onboarded: boolean;
  created_at: string;
}

export interface Score {
  id: number;
  user_id: number;
  game: GameName;
  played_date: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface TriadStatus {
  game: GameName;
  played: boolean;
  attempts: number | null;
  score_id: number | null;
}

export interface TodayHighlight {
  game: GameName;
  user_id: number | null;
  username: string | null;
  avatar_url: string | null;
  attempts: number | null;
}

export interface DailyChampion {
  user_id: number;
  username: string;
  avatar_url: string | null;
  victories: number;
  total_attempts: number;
  is_provisional: boolean;
}

export interface FriendActivity {
  user_id: number;
  username: string;
  avatar_url: string | null;
  games_played: number;
  games: GameName[];
}

export interface DashboardData {
  triad: TriadStatus[];
  streak: number;
  highlights: TodayHighlight[];
  champions: DailyChampion[];
  friends_activity: FriendActivity[];
}

export interface RankingEntry {
  position: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  game_victories: number;
  daily_championships: number;
  avg_attempts: number;
  total_games: number;
  streak: number;
  win_streak: number;
}

export interface GameRankingEntry {
  position: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  victories: number;
  avg_attempts: number;
  total_games: number;
}

export interface AttemptsDistribution {
  attempts: number;
  count: number;
}

export interface CalendarDay {
  date: string;
  games_played: number;
}

export interface CompareGameResult {
  game: GameName;
  avg_p1: number;
  avg_p2: number;
  victories_p1: number;
  victories_p2: number;
}

export interface CompareResponse {
  player1_id: number;
  player1_username: string;
  player2_id: number;
  player2_username: string;
  games: CompareGameResult[];
}

export interface RecordEntry {
  title: string;
  description: string;
  icon: string;
  user_id: number;
  username: string;
  avatar_url: string | null;
  value: string;
  game: GameName | null;
}

export interface RecordsResponse {
  records: RecordEntry[];
}

export type RankingPeriod = "hoje" | "semana" | "mes" | "todos";

// Letroso game types

export type LetterState = "correct" | "present" | "absent";

export interface LetterFeedback {
  letter: string;
  state: LetterState;
  position: number;
  edge_start?: boolean;
  edge_end?: boolean;
}

export interface GuessEntry {
  guess: string;
  feedback: LetterFeedback[];
}

export interface LetrosoGameState {
  guesses: GuessEntry[];
  solved: boolean;
  attempts: number | null;
}

export interface LetrosoStatus {
  played_today: boolean;
  solved: boolean;
  attempts: number | null;
}

// Historico game types

export type HistoricoEra =
  | "antiga"
  | "media"
  | "moderna"
  | "contemporanea"
  | "atual";

export type HistoricoDirection = "antes" | "depois" | "mesmo_ano" | "acertou";

export interface HistoricoEventOption {
  id: number;
  name: string;
  era: HistoricoEra;
}

export interface HistoricoGuessEntry {
  event_id: number;
  name: string;
  year: number;
  direction: HistoricoDirection;
}

export interface HistoricoTarget {
  name: string;
  year: number;
  category: string | null;
}

export interface HistoricoGameState {
  guesses: HistoricoGuessEntry[];
  solved: boolean;
  attempts: number | null;
  target: HistoricoTarget | null;
}

export interface HistoricoStatus {
  played_today: boolean;
  solved: boolean;
  attempts: number | null;
}
