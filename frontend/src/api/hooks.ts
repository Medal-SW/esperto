import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  CalendarDay,
  CompareResponse,
  DashboardData,
  AttemptsDistribution,
  GameName,
  GameRankingEntry,
  HistoricoEventOption,
  HistoricoGameState,
  HistoricoGuessEntry,
  LetterFeedback,
  LetrosoGameState,
  LetrosoStatus,
  RankingEntry,
  RankingPeriod,
  RecordsResponse,
  Score,
  User,
} from "../types";


export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/auth/me").then((r) => r.data),
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (body: { login: string; password: string }) =>
      api
        .post<{ access_token: string }>("/auth/login", body)
        .then((r) => r.data),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (body: { username: string; email: string; password: string }) =>
      api.post<User>("/auth/signup", body).then((r) => r.data),
  });
}

export function useConnectGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credential: string) =>
      api.post<User>("/auth/google/connect", { credential }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}


export function useMyScores() {
  return useQuery({
    queryKey: ["scores", "mine"],
    queryFn: () => api.get<Score[]>("/scores/mine").then((r) => r.data),
  });
}

export function useUpdateScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scoreId, attempts }: { scoreId: number; attempts: number }) =>
      api.put<Score>(`/scores/${scoreId}`, { attempts }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scores"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}


export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/dashboard").then((r) => r.data),
  });
}


export function useTodayScores() {
  return useQuery({
    queryKey: ["scores", "today"],
    queryFn: () => api.get<Score[]>("/scores/today").then((r) => r.data),
  });
}

export function useSubmitScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scores: { game: GameName; attempts: number }[]) =>
      api.post<Score[]>("/scores", { scores }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scores"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scoreId: number) => api.delete(`/scores/${scoreId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scores"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}


export function useGeneralRanking(period: RankingPeriod) {
  return useQuery({
    queryKey: ["ranking", "general", period],
    queryFn: () =>
      api
        .get<RankingEntry[]>("/ranking/general", { params: { period } })
        .then((r) => r.data),
  });
}

export function useGameRanking(game: GameName, period: RankingPeriod) {
  return useQuery({
    queryKey: ["ranking", "game", game, period],
    queryFn: () =>
      api
        .get<GameRankingEntry[]>(`/ranking/game/${game}`, { params: { period } })
        .then((r) => r.data),
  });
}


export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { display_name: string | null }) =>
      api.patch<User>("/auth/profile", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post<User>("/auth/avatar", form).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/auth/avatar").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}


export function useRecords() {
  return useQuery({
    queryKey: ["ranking", "records"],
    queryFn: () =>
      api.get<RecordsResponse>("/ranking/records").then((r) => r.data),
  });
}


export function useCompare(p1: number, p2: number) {
  return useQuery({
    queryKey: ["ranking", "compare", p1, p2],
    queryFn: () =>
      api
        .get<CompareResponse>(`/ranking/compare/${p1}/${p2}`)
        .then((r) => r.data),
    enabled: p1 > 0 && p2 > 0 && p1 !== p2,
  });
}


export function useDistribution(userId?: number, game?: GameName) {
  return useQuery({
    queryKey: ["stats", "distribution", userId, game],
    queryFn: () =>
      api
        .get<AttemptsDistribution[]>("/ranking/stats/distribution", {
          params: { user_id: userId, game },
        })
        .then((r) => r.data),
  });
}

export function useCalendar(userId: number) {
  return useQuery({
    queryKey: ["stats", "calendar", userId],
    queryFn: () =>
      api
        .get<CalendarDay[]>("/ranking/stats/calendar", {
          params: { user_id: userId },
        })
        .then((r) => r.data),
  });
}


export function useLetrosoGame() {
  return useQuery({
    queryKey: ["letroso", "today"],
    queryFn: () =>
      api.get<LetrosoGameState>("/letroso/today").then((r) => r.data),
  });
}

export function useSubmitGuess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guess: string) =>
      api
        .post<{
          guess: string;
          feedback: LetterFeedback[];
          solved: boolean;
          game_state: LetrosoGameState;
        }>("/letroso/guess", { guess })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["letroso"] });
      qc.invalidateQueries({ queryKey: ["scores"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useLetrosoStatus() {
  return useQuery({
    queryKey: ["letroso", "status"],
    queryFn: () =>
      api.get<LetrosoStatus>("/letroso/status").then((r) => r.data),
  });
}


export function useHistoricoGame() {
  return useQuery({
    queryKey: ["historico", "today"],
    queryFn: () =>
      api.get<HistoricoGameState>("/historico/today").then((r) => r.data),
  });
}

export function useHistoricoEventos() {
  return useQuery({
    queryKey: ["historico", "eventos"],
    queryFn: () =>
      api
        .get<HistoricoEventOption[]>("/historico/eventos")
        .then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useHistoricoGuess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) =>
      api
        .post<{
          guess: HistoricoGuessEntry;
          solved: boolean;
          game_state: HistoricoGameState;
        }>("/historico/guess", { event_id: eventId })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["historico"] });
      qc.invalidateQueries({ queryKey: ["scores"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
  });
}
