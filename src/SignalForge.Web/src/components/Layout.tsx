import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  Radar,
  Star,
  Briefcase,
  Globe,
  Filter,
  Settings,
  LogOut,
  Activity,
  Brain,
  Bell,
  Shield,
  Users,
  Wrench,
  FlaskConical,
  Bot,
  Trophy,
  ArrowLeftRight,
  Calendar,
  Landmark,
  UserCheck,
  Target,
  Sparkles,
  BookOpen,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Rocket,
  MessageCircle,
  PieChart,
  Grid3X3,
  Receipt,
  Webhook,
  Users as UsersIcon,
  LayoutGrid,
  RefreshCw,
  AlertTriangle,
  Share2,
  FileDown,
  LineChart as MultiLineChart,
  Bell as BellNav,
  ClipboardList,
  Download,
  Gift,
  HelpCircle,
  MessageSquare as FeedbackIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import TopBar from './TopBar';
import ScrollingTicker from './ScrollingTicker';
import ToastContainer from './common/Toast';
import LiveChat from './LiveChat';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/signals', icon: Radar, label: 'Signals' },
  { to: '/market', icon: Globe, label: 'Market' },
  { to: '/insights', icon: Brain, label: 'AI Insights' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/screener', icon: Filter, label: 'Screener' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/backtest', icon: FlaskConical, label: 'Backtest' },
  { to: '/chat', icon: Bot, label: 'AI Chat' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/compare', icon: ArrowLeftRight, label: 'Compare' },
  { to: '/earnings', icon: Calendar, label: 'Earnings' },
  { to: '/economic-calendar', icon: Landmark, label: 'Economy' },
  { to: '/insider-trades', icon: UserCheck, label: 'Insiders' },
  { to: '/price-predictor', icon: Target, label: 'AI Predict' },
  { to: '/portfolio-optimizer', icon: Sparkles, label: 'Optimizer' },
  { to: '/trade-journal', icon: BookOpen, label: 'Journal' },
  { to: '/natural-query', icon: MessageSquare, label: 'AI Query' },
  { to: '/sentiment-trend', icon: TrendingUp, label: 'Sentiment' },
  { to: '/dividends', icon: DollarSign, label: 'Dividends' },
  { to: '/ipos', icon: Rocket, label: 'IPOs' },
  { to: '/discussion', icon: MessageCircle, label: 'Discuss' },
  { to: '/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/correlation', icon: Grid3X3, label: 'Correlation' },
  { to: '/tax-report', icon: Receipt, label: 'Tax Report' },
  { to: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { to: '/copy-trading', icon: UsersIcon, label: 'Copy Trade' },
  { to: '/heatmap', icon: LayoutGrid, label: 'Heatmap' },
  { to: '/sector-rotation', icon: RefreshCw, label: 'Sectors' },
  { to: '/anomaly-detector', icon: AlertTriangle, label: 'Anomalies' },
  { to: '/share-signal', icon: Share2, label: 'Share' },
  { to: '/pdf-export', icon: FileDown, label: 'Export' },
  { to: '/multi-chart', icon: MultiLineChart, label: 'Charts' },
  { to: '/notifications', icon: BellNav, label: 'Notifications' },
  { to: '/activity-log', icon: ClipboardList, label: 'Activity' },
  { to: '/data-export', icon: Download, label: 'Data Export' },
  { to: '/referral', icon: Gift, label: 'Referral' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
  { to: '/feedback', icon: FeedbackIcon, label: 'Feedback' },
  { to: '/connected-accounts', icon: LinkIcon, label: 'Connections' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminItems = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/roles', icon: Shield, label: 'Roles' },
  { to: '/admin/config', icon: Wrench, label: 'Config' },
];

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-bg">
      <ToastContainer />

      {/* Sidebar */}
      <aside className="w-16 lg:w-56 bg-surface/50 backdrop-blur-sm border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 lg:p-4 border-b border-border">
          <div className="flex items-center gap-2.5 justify-center lg:justify-start">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <span className="text-base font-black gradient-text hidden lg:block">SignalForge</span>
          </div>
        </div>

        <nav className="flex-1 p-2 lg:p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} title={label}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all justify-center lg:justify-start relative ${
                  isActive ? 'bg-accent/8 text-accent' : 'text-text-muted hover:text-text-primary hover:bg-surface-light'
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent rounded-r hidden lg:block" />}
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="hidden lg:block">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Admin Section */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="px-3 mb-1 hidden lg:block">
              <span className="text-[9px] font-bold text-text-muted/50 uppercase tracking-widest">Admin</span>
            </div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/admin'} title={label}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all justify-center lg:justify-start relative ${
                    isActive ? 'bg-purple/8 text-purple' : 'text-text-muted hover:text-text-primary hover:bg-surface-light'
                  }`
                }>
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple rounded-r hidden lg:block" />}
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="hidden lg:block">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-2 lg:p-2.5 border-t border-border">
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-text-muted hover:text-danger hover:bg-danger/5 transition-all w-full justify-center lg:justify-start"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <div className="animate-fade-up">
            <Outlet />
          </div>
        </main>
        <ScrollingTicker />
      </div>

      <LiveChat />
    </div>
  );
}
