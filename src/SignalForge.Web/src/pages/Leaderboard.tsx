import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Users } from 'lucide-react';
import { socialApi } from '../api/backtest';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Leaderboard() {
  const { data: entries, isLoading } = useQuery({ queryKey: ['leaderboard'], queryFn: socialApi.getLeaderboard });

  if (isLoading) return <LoadingSpinner text="Loading leaderboard..." />;

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Signal Leaderboard</h1>
          <p className="text-xs text-text-muted">Top performing signal generators</p>
        </div>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-4 items-end">
        {[top3[1], top3[0], top3[2]].map((entry, i) => {
          if (!entry) return <div key={i} />;
          const pos = i === 1 ? 1 : i === 0 ? 2 : 3;
          const medalColors = ['', 'text-yellow-400', 'text-gray-300', 'text-amber-600'];
          const heights = ['', 'h-48', 'h-40', 'h-36'];
          const borders = ['', 'border-yellow-400/30', 'border-gray-400/30', 'border-amber-600/30'];

          return (
            <div key={entry.userId} className={`bg-surface border ${borders[pos]} rounded-xl p-4 ${heights[pos]} flex flex-col items-center justify-end card-hover`}>
              <Medal className={`w-8 h-8 ${medalColors[pos]} mb-2`} />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center text-accent font-black text-lg mb-2">
                {entry.avatar}
              </div>
              <div className="text-sm font-black text-text-primary text-center">{entry.userName}</div>
              <div className={`text-lg font-black mt-1 ${entry.totalReturn >= 0 ? 'text-accent' : 'text-danger'}`}>
                {entry.totalReturn >= 0 ? '+' : ''}{entry.totalReturn}%
              </div>
              <div className="text-[10px] text-text-muted mt-1">{entry.winRate}% win rate</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-text-muted border-b border-border bg-bg/30 uppercase tracking-wider">
              <th className="text-left py-3 px-5">Rank</th>
              <th className="text-left py-3 px-5">Trader</th>
              <th className="text-right py-3 px-5">Return</th>
              <th className="text-right py-3 px-5">Win Rate</th>
              <th className="text-right py-3 px-5">Signals</th>
              <th className="text-right py-3 px-5">Avg Confidence</th>
              <th className="text-right py-3 px-5">Followers</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((e) => (
              <tr key={e.userId} className="border-b border-border/20 hover:bg-bg/30 transition-colors">
                <td className="py-2.5 px-5 text-text-muted font-mono font-bold">#{e.rank}</td>
                <td className="py-2.5 px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-surface-light flex items-center justify-center text-accent text-[10px] font-black">{e.avatar}</div>
                    <span className="font-semibold text-text-primary">{e.userName}</span>
                  </div>
                </td>
                <td className={`text-right py-2.5 px-5 font-bold font-mono ${e.totalReturn >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {e.totalReturn >= 0 ? '+' : ''}{e.totalReturn}%
                </td>
                <td className="text-right py-2.5 px-5">
                  <span className={`font-mono ${e.winRate >= 55 ? 'text-accent' : 'text-text-muted'}`}>{e.winRate}%</span>
                </td>
                <td className="text-right py-2.5 px-5 text-text-muted font-mono">{e.totalSignals}</td>
                <td className="text-right py-2.5 px-5 text-text-muted font-mono">{e.avgConfidence}%</td>
                <td className="text-right py-2.5 px-5">
                  <span className="flex items-center justify-end gap-1 text-text-muted">
                    <Users className="w-3 h-3" /> {e.followers}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
