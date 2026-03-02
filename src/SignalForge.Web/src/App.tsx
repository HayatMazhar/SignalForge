import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { useThemeStore } from './stores/themeStore';
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
import Earnings from './pages/Earnings';
import EconomicCalendar from './pages/EconomicCalendar';
import InsiderTrades from './pages/InsiderTrades';
import PricePredictor from './pages/PricePredictor';
import PortfolioOptimizer from './pages/PortfolioOptimizer';
import TradeJournal from './pages/TradeJournal';
import NaturalQuery from './pages/NaturalQuery';
import SentimentTrend from './pages/SentimentTrend';
import Dividends from './pages/Dividends';
import IpoCalendar from './pages/IpoCalendar';
import Discussion from './pages/Discussion';
import Analytics from './pages/Analytics';
import CorrelationMatrix from './pages/CorrelationMatrix';
import TaxReport from './pages/TaxReport';
import Webhooks from './pages/Webhooks';
import CopyTrading from './pages/CopyTrading';
import Heatmap from './pages/Heatmap';
import SectorRotation from './pages/SectorRotation';
import AnomalyDetector from './pages/AnomalyDetector';
import ShareSignal from './pages/ShareSignal';
import PdfExport from './pages/PdfExport';
import MultiChart from './pages/MultiChart';
import AiChat from './pages/AiChat';
import Leaderboard from './pages/Leaderboard';
import Compare from './pages/Compare';
import NotificationCenter from './pages/NotificationCenter';
import ActivityLog from './pages/ActivityLog';
import DataExport from './pages/DataExport';
import Referral from './pages/Referral';
import HelpCenter from './pages/HelpCenter';
import Feedback from './pages/Feedback';
import ConnectedAccounts from './pages/ConnectedAccounts';

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
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

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
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/economic-calendar" element={<EconomicCalendar />} />
            <Route path="/insider-trades" element={<InsiderTrades />} />
            <Route path="/price-predictor" element={<PricePredictor />} />
            <Route path="/portfolio-optimizer" element={<PortfolioOptimizer />} />
            <Route path="/trade-journal" element={<TradeJournal />} />
            <Route path="/natural-query" element={<NaturalQuery />} />
            <Route path="/sentiment-trend" element={<SentimentTrend />} />
            <Route path="/dividends" element={<Dividends />} />
            <Route path="/ipos" element={<IpoCalendar />} />
            <Route path="/discussion" element={<Discussion />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/correlation" element={<CorrelationMatrix />} />
            <Route path="/tax-report" element={<TaxReport />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/copy-trading" element={<CopyTrading />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/sector-rotation" element={<SectorRotation />} />
            <Route path="/anomaly-detector" element={<AnomalyDetector />} />
            <Route path="/share-signal" element={<ShareSignal />} />
            <Route path="/pdf-export" element={<PdfExport />} />
            <Route path="/multi-chart" element={<MultiChart />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="/admin/config" element={<SystemConfig />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/data-export" element={<DataExport />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/connected-accounts" element={<ConnectedAccounts />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
