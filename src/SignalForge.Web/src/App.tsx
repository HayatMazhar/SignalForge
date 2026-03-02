import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Signals from './pages/Signals';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import News from './pages/News';
import MarketOverview from './pages/MarketOverview';
import Screener from './pages/Screener';
import SettingsPage from './pages/SettingsPage';
import Insights from './pages/Insights';
import Alerts from './pages/Alerts';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import SystemConfig from './pages/admin/SystemConfig';
import Backtest from './pages/Backtest';
import AiChat from './pages/AiChat';
import Leaderboard from './pages/Leaderboard';
import Compare from './pages/Compare';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks/:symbol" element={<StockDetail />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/market" element={<MarketOverview />} />
            <Route path="/news" element={<News />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/chat" element={<AiChat />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="/admin/config" element={<SystemConfig />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
