import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      login(res.token, res.refreshToken, res.user);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-info/5 rounded-full blur-3xl" />

        <div className="relative z-10 animate-fade-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center animate-pulse-glow">
              <Activity className="w-7 h-7 text-accent" />
            </div>
            <span className="text-3xl font-black gradient-text">SignalForge</span>
          </div>

          <h1 className="text-4xl font-black text-text-primary leading-tight mb-4">
            AI-Powered<br />
            <span className="gradient-text">Trading Intelligence</span>
          </h1>
          <p className="text-lg text-text-muted max-w-md mb-10">
            Institutional-grade market analysis, real-time signals, and smart money tracking — all in one platform.
          </p>

          <div className="space-y-4">
            <FeatureRow icon={Zap} text="Real-time AI buy/sell signals with confidence scores" />
            <FeatureRow icon={BarChart3} text="Options flow analysis and smart money tracking" />
            <FeatureRow icon={Shield} text="Portfolio risk radar and automated alerts" />
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Activity className="w-9 h-9 text-accent" />
            <span className="text-2xl font-black gradient-text">SignalForge</span>
          </div>

          <div className="glass-strong rounded-2xl p-8 border-gradient">
            <h2 className="text-2xl font-black text-text-primary mb-1">Welcome back</h2>
            <p className="text-sm text-text-muted mb-6">Sign in to access your trading dashboard</p>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg/50 border border-border rounded-xl pl-11 pr-4 py-3 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-all"
                    placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg/50 border border-border rounded-xl pl-11 pr-4 py-3 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-all"
                    placeholder="••••••••" required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-accent text-bg font-bold text-sm hover:bg-accent-dim transition-all disabled:opacity-50 btn-shine flex items-center justify-center gap-2 glow-accent">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-accent font-semibold hover:text-accent-dim transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </div>

          <p className="text-[10px] text-text-muted/50 text-center mt-6">
            By signing in you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: typeof Zap; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <span className="text-sm text-text-muted">{text}</span>
    </div>
  );
}
