import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export default function Register() {
  const [fullName, setFullName] = useState('');
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
      const res = await authApi.register(email, password, fullName);
      login(res.token, res.refreshToken, res.user);
      navigate('/');
    } catch {
      setError('Registration failed. Try a stronger password (8+ chars, uppercase, digit).');
    } finally {
      setLoading(false);
    }
  };

  const passStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 : 2;
  const strengthColors = ['', 'bg-danger', 'bg-warning', 'bg-accent'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center animate-pulse-glow">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <span className="text-2xl font-black gradient-text">SignalForge</span>
        </div>

        <div className="glass-strong rounded-2xl p-8 border-gradient">
          <h2 className="text-2xl font-black text-text-primary mb-1">Create your account</h2>
          <p className="text-sm text-text-muted mb-6">Start trading with AI-powered intelligence</p>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-bg/50 border border-border rounded-xl pl-11 pr-4 py-3 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-all"
                  placeholder="John Doe" required />
              </div>
            </div>
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
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= passStrength ? strengthColors[passStrength] : 'bg-border'} transition-colors`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-semibold ${passStrength === 3 ? 'text-accent' : passStrength === 2 ? 'text-warning' : 'text-danger'}`}>
                    {strengthLabels[passStrength]}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-accent text-bg font-bold text-sm hover:bg-accent-dim transition-all disabled:opacity-50 btn-shine flex items-center justify-center gap-2 glow-accent">
              {loading ? (
                <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {['Free AI signals for 5 stocks', 'Real-time market data', 'Portfolio tracking'].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-text-muted">
                <Check className="w-3.5 h-3.5 text-accent" /> {f}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:text-accent-dim transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
