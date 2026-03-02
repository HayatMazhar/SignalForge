import { useState, useMemo } from 'react';
import { Gift, Copy, Check, Twitter, Mail, Trophy, Users, Crown, Zap, Star, Award } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return 'SF' + Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
}

const TIERS = [
  { friends: 1, reward: '1 Month Free Pro', icon: Star, color: 'text-accent', bg: 'bg-accent' },
  { friends: 5, reward: 'Lifetime Pro Access', icon: Zap, color: 'text-purple', bg: 'bg-purple' },
  { friends: 10, reward: 'Lifetime Elite Access', icon: Crown, color: 'text-warning', bg: 'bg-warning' },
];

const LEADERBOARD = [
  { rank: 1, name: 'TraderMike', referrals: 47, earned: '$4,653' },
  { rank: 2, name: 'AlphaQuant', referrals: 38, earned: '$3,762' },
  { rank: 3, name: 'WallStWolf', referrals: 31, earned: '$3,069' },
  { rank: 4, name: 'SignalKing', referrals: 24, earned: '$2,376' },
  { rank: 5, name: 'BullishBear', referrals: 19, earned: '$1,881' },
  { rank: 6, name: 'QuantumTrader', referrals: 15, earned: '$1,485' },
  { rank: 7, name: 'DeltaHedge', referrals: 12, earned: '$1,188' },
  { rank: 8, name: 'GammaSlayer', referrals: 9, earned: '$891' },
];

export default function Referral() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const referralCode = useMemo(() => hashCode(user?.email ?? 'user'), [user]);
  const referralLink = `https://signalforge.io/join?ref=${referralCode}`;

  const invited = 0;
  const earned = 0;
  const currentTierIdx = TIERS.findIndex((t) => invited < t.friends);
  const nextTier = TIERS[currentTierIdx === -1 ? TIERS.length - 1 : currentTierIdx];
  const progress = nextTier ? Math.min((invited / nextTier.friends) * 100, 100) : 100;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on SignalForge — AI-powered trading signals! Use my link: ${referralLink}`)}`, '_blank');
  };
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out SignalForge for AI trading signals: ${referralLink}`)}`, '_blank');
  };
  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent('Join SignalForge')}&body=${encodeURIComponent(`Hey! I've been using SignalForge for AI-powered trading signals and it's been great. Join using my referral link: ${referralLink}`)}`, '_blank');
  };

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Referral Program</h1>
          <p className="text-xs text-text-muted">Invite friends, earn rewards</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-5 text-center card-hover animate-fade-up">
          <Users className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-3xl font-black text-text-primary font-mono">{invited}</div>
          <p className="text-xs text-text-muted mt-1">Friends Invited</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 text-center card-hover animate-fade-up" style={{ animationDelay: '60ms' }}>
          <Gift className="w-6 h-6 text-warning mx-auto mb-2" />
          <div className="text-3xl font-black text-text-primary font-mono">${earned}</div>
          <p className="text-xs text-text-muted mt-1">Total Earned</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 text-center card-hover animate-fade-up" style={{ animationDelay: '120ms' }}>
          <Award className="w-6 h-6 text-purple mx-auto mb-2" />
          <div className="text-lg font-black text-text-primary">{nextTier?.reward ?? 'All Unlocked'}</div>
          <p className="text-xs text-text-muted mt-1">Next Reward</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-sm font-bold text-text-primary mb-3">Your Referral Link</h2>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-muted font-mono truncate">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              copied ? 'bg-accent/20 text-accent' : 'bg-accent text-bg hover:bg-accent-dim btn-shine glow-accent'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold mr-2">Share via</span>
          <button onClick={shareTwitter} className="w-9 h-9 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 flex items-center justify-center transition-colors">
            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
          </button>
          <button onClick={shareWhatsApp} className="w-9 h-9 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.632-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.16 0-4.16-.686-5.795-1.853l-.404-.296-2.75.871.83-2.657-.326-.425A9.697 9.697 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
            </svg>
          </button>
          <button onClick={shareEmail} className="w-9 h-9 rounded-lg bg-purple/10 hover:bg-purple/20 flex items-center justify-center transition-colors">
            <Mail className="w-4 h-4 text-purple" />
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] text-text-muted font-mono">
            Referral Code: <span className="text-text-primary font-bold">{referralCode}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reward Tiers */}
        <div className="bg-surface border border-border rounded-2xl p-6 card-hover animate-fade-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-lg font-black text-text-primary mb-5">Reward Tiers</h2>
          <div className="space-y-4">
            {TIERS.map((tier, i) => {
              const Icon = tier.icon;
              const unlocked = invited >= tier.friends;
              return (
                <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${unlocked ? 'border-accent/20 bg-accent/5' : 'border-border'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlocked ? `${tier.bg}/20` : 'bg-bg'}`}>
                    <Icon className={`w-5 h-5 ${unlocked ? tier.color : 'text-text-muted/40'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${unlocked ? 'text-text-primary' : 'text-text-muted'}`}>{tier.reward}</p>
                    <p className="text-xs text-text-muted">{tier.friends} friend{tier.friends > 1 ? 's' : ''} required</p>
                  </div>
                  {unlocked ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-bold">Unlocked</span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-bg text-text-muted font-bold">{invited}/{tier.friends}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Progress to next tier</span>
              <span className="text-xs font-bold text-accent font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-purple rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-surface border border-border rounded-2xl p-6 card-hover animate-fade-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-black text-text-primary">Top Referrers</h2>
          </div>
          <div className="space-y-2">
            {LEADERBOARD.map((entry) => (
              <div key={entry.rank} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg/50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                  entry.rank === 1 ? 'bg-warning/15 text-warning' :
                  entry.rank === 2 ? 'bg-text-muted/10 text-text-muted' :
                  entry.rank === 3 ? 'bg-orange-500/15 text-orange-400' :
                  'bg-bg text-text-muted/50'
                }`}>
                  {entry.rank <= 3 ? (
                    <Crown className="w-3.5 h-3.5" />
                  ) : (
                    entry.rank
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{entry.name}</p>
                  <p className="text-[10px] text-text-muted">{entry.referrals} referrals</p>
                </div>
                <span className="text-sm font-bold text-accent font-mono">{entry.earned}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
