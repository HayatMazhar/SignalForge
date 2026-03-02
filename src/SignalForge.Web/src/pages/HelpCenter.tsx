import { useState, useMemo } from 'react';
import { HelpCircle, Search, ChevronDown, Mail, MessageCircle, Play, Rocket, Radar, Briefcase, Bell, Brain, CreditCard, Shield } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: typeof Rocket;
  color: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    title: 'Getting Started',
    icon: Rocket,
    color: 'text-accent',
    items: [
      { question: 'How do I create an account?', answer: 'Click "Sign Up" on the landing page, enter your email and password, and verify your email. You\'ll get instant access to the Free tier with basic features.' },
      { question: 'What is SignalForge?', answer: 'SignalForge is an AI-powered stock trading intelligence platform. It generates buy/sell signals using machine learning, tracks your portfolio, provides market insights, and offers advanced tools like backtesting and anomaly detection.' },
      { question: 'Is SignalForge free to use?', answer: 'Yes! The Free tier includes 5 watchlist stocks, 3 active alerts, delayed signals, and basic charts. Upgrade to Pro ($49/mo) or Elite ($99/mo) for real-time signals, AI features, and more.' },
      { question: 'How do I navigate the platform?', answer: 'Use the sidebar on the left to access all features: Dashboard, Signals, Market, Portfolio, and more. The top bar has search and quick actions. Everything is organized for fast access during trading hours.' },
      { question: 'Can I use SignalForge on mobile?', answer: 'SignalForge is fully responsive and works great on mobile browsers. A dedicated mobile app is coming soon with push notifications and quick trade actions.' },
    ],
  },
  {
    title: 'Signals & Trading',
    icon: Radar,
    color: 'text-info',
    items: [
      { question: 'How are signals generated?', answer: 'Our AI analyzes 50+ technical indicators, sentiment data from news and social media, options flow, institutional activity, and historical patterns. Each signal includes a confidence score (0-100%) and recommended entry/exit points.' },
      { question: 'What does the confidence score mean?', answer: 'The confidence score reflects how strongly our model believes in the signal. Scores above 80% are high-confidence, 60-80% are moderate, and below 60% are speculative. You can set your minimum threshold in Settings.' },
      { question: 'Should I blindly follow signals?', answer: 'No. Signals are decision-support tools, not financial advice. Always do your own research, consider your risk tolerance, and never invest more than you can afford to lose. Past performance doesn\'t guarantee future results.' },
      { question: 'How often are signals updated?', answer: 'Signals are generated in real-time during market hours (9:30 AM - 4:00 PM ET) for Pro/Elite users. Free tier users receive delayed signals updated every 15 minutes.' },
    ],
  },
  {
    title: 'Portfolio Management',
    icon: Briefcase,
    color: 'text-purple',
    items: [
      { question: 'How do I add positions?', answer: 'Go to Portfolio > Add Position. Enter the symbol, quantity, and purchase price. You can also connect a broker from Connected Accounts for automatic syncing.' },
      { question: 'Does SignalForge execute trades?', answer: 'Currently, SignalForge is an analysis and intelligence platform. We don\'t execute trades directly. You can connect brokers to sync positions and use our signals to inform your trading decisions.' },
      { question: 'How is P&L calculated?', answer: 'Profit/Loss is calculated as (Current Price - Average Cost) × Shares for each position. We use real-time market prices during trading hours and closing prices after hours.' },
      { question: 'Can I track crypto?', answer: 'Yes! Connect your Coinbase account from Connected Accounts, or manually add crypto positions. We support BTC, ETH, and 50+ other cryptocurrencies.' },
    ],
  },
  {
    title: 'Alerts & Notifications',
    icon: Bell,
    color: 'text-warning',
    items: [
      { question: 'How do I set up price alerts?', answer: 'Go to any stock detail page or the Alerts page. Click "Create Alert", select the condition (above/below price, % change, volume spike), and set your target. You\'ll be notified via push, email, or in-app.' },
      { question: 'How many alerts can I have?', answer: 'Free: 3 active alerts. Pro: 25 active alerts. Elite: Unlimited alerts including webhook integrations for custom automation.' },
      { question: 'What types of alerts are available?', answer: 'Price target (above/below), percentage change, volume spike, AI signal trigger, earnings date, insider trading activity, and custom anomaly detection alerts.' },
    ],
  },
  {
    title: 'AI Features',
    icon: Brain,
    color: 'text-accent',
    items: [
      { question: 'What AI models does SignalForge use?', answer: 'We use a proprietary ensemble of transformer-based models, LSTM networks for time series, and NLP models for sentiment analysis. Models are retrained weekly on latest market data.' },
      { question: 'What is AI Chat?', answer: 'AI Chat is a conversational interface where you can ask questions about any stock, get analysis, compare securities, and receive personalized insights. It understands natural language queries like "Should I buy AAPL?".' },
      { question: 'How accurate is the AI Predictor?', answer: 'Our price predictor has shown 62-68% directional accuracy on back-tested data (2020-2025). Accuracy varies by market conditions and timeframe. Always use predictions as one input among many in your decision-making.' },
      { question: 'What is anomaly detection?', answer: 'Our AI monitors all tracked stocks for unusual patterns: volume spikes, price divergences, options flow anomalies, and sentiment shifts. When detected, you receive an alert with context about what\'s happening.' },
    ],
  },
  {
    title: 'Billing & Subscription',
    icon: CreditCard,
    color: 'text-info',
    items: [
      { question: 'How do I upgrade my plan?', answer: 'Go to Settings > Subscription. Choose Pro ($49/mo) or Elite ($99/mo). We accept all major credit cards and PayPal. Annual billing saves 20%.' },
      { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time from Settings > Subscription. You\'ll retain access to paid features until the end of your billing period.' },
      { question: 'Do you offer refunds?', answer: 'We offer a 14-day money-back guarantee on all paid plans. Contact support@signalforge.io within 14 days of purchase for a full refund.' },
      { question: 'Is there a student discount?', answer: 'Yes! Students with a valid .edu email get 50% off Pro and Elite plans. Contact support with your student email to activate the discount.' },
    ],
  },
  {
    title: 'Security & Privacy',
    icon: Shield,
    color: 'text-danger',
    items: [
      { question: 'Is my data secure?', answer: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use SOC 2 compliant infrastructure on AWS. We never sell your data or share it with third parties.' },
      { question: 'Do you support 2FA?', answer: 'Yes, two-factor authentication is available via authenticator app (Google Authenticator, Authy) or SMS. Enable it in Settings > Security for enhanced account protection.' },
      { question: 'Can I export my data?', answer: 'Yes! Visit the Data Export page to download your portfolio, signals, watchlist, and trade journal as CSV files. You own your data.' },
      { question: 'How do I delete my account?', answer: 'Go to Settings > Profile > Danger Zone > Delete Account. This permanently removes all your data. Export your data first if needed.' },
    ],
  },
];

const TUTORIALS = [
  { title: 'Getting Started with SignalForge', duration: '5:32', views: '12.4K' },
  { title: 'How to Read AI Signals', duration: '8:15', views: '8.7K' },
  { title: 'Setting Up Your First Alert', duration: '3:45', views: '6.2K' },
  { title: 'Portfolio Optimization Guide', duration: '11:20', views: '4.8K' },
  { title: 'Backtesting Your Strategy', duration: '9:48', views: '3.5K' },
  { title: 'Advanced: Webhook Integrations', duration: '7:10', views: '2.1K' },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleQuestion = (key: string) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-7 h-7 text-accent" />
        </div>
        <h1 className="text-3xl font-black text-text-primary">Help Center</h1>
        <p className="text-sm text-text-muted mt-2">Find answers to common questions</p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-xl mx-auto animate-fade-up">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full bg-surface border border-border rounded-2xl pl-12 pr-4 py-4 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all"
        />
      </div>

      {/* FAQ Sections */}
      <div className="space-y-4 mb-10">
        {filteredSections.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
            <p className="text-sm text-text-muted">No results found for "{searchQuery}"</p>
            <p className="text-xs text-text-muted/50 mt-1">Try different keywords or browse sections below.</p>
          </div>
        )}
        {filteredSections.map((section, si) => {
          const Icon = section.icon;
          const isOpen = openSections.has(si);
          return (
            <div
              key={section.title}
              style={{ animationDelay: `${si * 40}ms` }}
              className="animate-fade-up bg-surface border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => toggleSection(si)}
                className="w-full flex items-center gap-3 p-5 hover:bg-surface-light transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color.replace('text-', 'bg-')}/10`}>
                  <Icon className={`w-4.5 h-4.5 ${section.color}`} />
                </div>
                <span className="text-base font-bold text-text-primary flex-1 text-left">{section.title}</span>
                <span className="text-[10px] text-text-muted mr-2">{section.items.length} questions</span>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  {section.items.map((item, qi) => {
                    const key = `${si}-${qi}`;
                    const qOpen = openQuestions.has(key);
                    return (
                      <div key={qi} className="border-b border-border/50 last:border-0">
                        <button
                          onClick={() => toggleQuestion(key)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-bg/50 transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${qOpen ? 'bg-accent/10 text-accent' : 'bg-bg text-text-muted'}`}>
                            {qOpen ? '−' : '+'}
                          </div>
                          <span className={`text-sm text-left flex-1 ${qOpen ? 'font-bold text-text-primary' : 'font-medium text-text-muted'}`}>
                            {item.question}
                          </span>
                        </button>
                        {qOpen && (
                          <div className="px-5 pb-4 pl-13 animate-fade-up">
                            <p className="text-sm text-text-muted leading-relaxed pl-8">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Video Tutorials */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-text-primary mb-4">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TUTORIALS.map((video, i) => (
            <div
              key={i}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-fade-up bg-surface border border-border rounded-2xl overflow-hidden card-hover cursor-pointer group"
            >
              <div className="relative h-32 bg-gradient-to-br from-accent/5 via-purple/5 to-info/5 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-bg/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-border">
                  <Play className="w-5 h-5 text-accent ml-0.5" />
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-text-muted bg-bg/80 px-2 py-0.5 rounded-md">
                  {video.duration}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-text-primary">{video.title}</h3>
                <p className="text-[10px] text-text-muted mt-1">{video.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-surface border border-border rounded-2xl p-6 text-center animate-fade-up">
        <h2 className="text-lg font-black text-text-primary mb-2">Still need help?</h2>
        <p className="text-sm text-text-muted mb-5">Our support team is available 24/7 to assist you.</p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="mailto:support@signalforge.io"
            className="px-5 py-2.5 rounded-xl bg-surface-light border border-border text-sm font-bold text-text-primary hover:border-accent/30 hover:text-accent transition-all flex items-center gap-2"
          >
            <Mail className="w-4 h-4" /> Email Support
          </a>
          <button className="px-5 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent-dim transition-all btn-shine glow-accent flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Live Chat
          </button>
        </div>
      </div>
    </div>
  );
}
