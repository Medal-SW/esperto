import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/Dashboard";
import { HistoricoPage } from "./pages/Historico";
import { HistoryPage } from "./pages/History";
import { LetrosoTest } from "./pages/LetrosoTest";
import { LoginPage } from "./pages/Login";
import { OnboardingPage } from "./pages/Onboarding";
import { PlayPage } from "./pages/Play";
import { ProfilePage } from "./pages/Profile";
import { RankingPage } from "./pages/Ranking";
import { SubmitPage } from "./pages/Submit";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/letroso" element={<LetrosoTest />} />
        <Route path="/historico" element={<HistoricoPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
