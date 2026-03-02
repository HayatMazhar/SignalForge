import { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie,
} from 'recharts';

interface SectorPerformance {
  sector: string;
  '1W': number;
  '1M': number;
  '3M': number;
  'YTD': number;
  weight: number;
  color: string;
}

const SECTORS: SectorPerformance[] = [
  { sector: 'Technology', '1W': 2.1, '1M': 5.4, '3M': 12.3, 'YTD': 18.7, weight: 28, color: '#00FF94' },
  { sector: 'Healthcare', '1W': 0.8, '1M': 2.1, '3M': 4.5, 'YTD': 7.2, weight: 14, color: '#3B82F6' },
  { sector: 'Financial', '1W': 1.5, '1M': 3.8, '3M': 8.1, 'YTD': 14.3, weight: 13, color: '#F59E0B' },
  { sector: 'Consumer', '1W': -0.3, '1M': 1.2, '3M': 3.7, 'YTD': 9.1, weight: 15, color: '#A855F7' },
  { sector: 'Energy', '1W': -1.8, '1M': -3.2, '3M': -5.4, 'YTD': -8.1, weight: 10, color: '#EF4444' },
  { sector: 'Industrials', '1W': 0.4, '1M': 1.9, '3M': 5.8, 'YTD': 10.5, weight: 12, color: '#06B6D4' },
  { sector: 'Communication', '1W': -0.6, '1M': -0.8, '3M': 2.1, 'YTD': 5.3, weight: 8, color: '#EC4899' },
];

type Period = '1W' | '1M' | '3M' | 'YTD';
const PERIODS: Period[] = ['1W', '1M', '3M', 'YTD'];

const AI_RECOMMENDATIONS = {
  rotateInto: [
    {
      sector: 'Technology',
      reason: 'Strong earnings momentum, AI spending tailwinds, and improving breadth across semiconductors and software. Relative strength scores are at 52-week highs.',
    },
    {
      sector: 'Financial',
      reason: 'Steepening yield curve benefits net interest margins. Credit quality remains solid and capital return programs are accelerating.',
    },
  ],
  rotateOutOf: [
    {
      sector: 'Energy',
      reason: 'Weakening global demand forecasts and OPEC+ supply uncertainty. Sector shows negative momentum across all measured timeframes.',
    },
    {
      sector: 'Communication',
      reason: 'Ad revenue headwinds and regulatory overhang. Relative underperformance versus defensive sectors signals capital rotation away.',
    },
  ],
};

export default function SectorRotation() {
  const [activePeriod, setActivePeriod] = useState<Period>('1M');

  const chartData = SECTORS.map(s => ({
    sector: s.sector,
    return: s[activePeriod],
    color: s.color,
  })).sort((a, b) => b.return - a.return);

  const pieData = SECTORS.map(s => ({
    name: s.sector,
    value: s.weight,
    fill: s.color,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">AI Sector Rotation</h1>
          <p className="text-xs text-text-muted">Model-driven sector allocation recommendations</p>
        </div>
      </div>

      {/* Period selector + Bar chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Sector Returns by Period</h3>
          <div className="flex gap-1 bg-bg rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activePeriod === p
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1F35" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#5B6378', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="sector"
              tick={{ fill: '#5B6378', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0C0F1A', border: '1px solid #1A1F35', borderRadius: 8, fontSize: 11, color: '#F0F4F8' }}
              formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, 'Return']}
            />
            <Bar dataKey="return" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.return >= 0 ? '#00FF94' : '#EF4444'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-text-muted border-b border-border bg-bg/30 uppercase tracking-wider">
              <th className="text-left py-3 px-5">Sector</th>
              {PERIODS.map(p => (
                <th key={p} className="text-right py-3 px-5">{p}</th>
              ))}
              <th className="text-right py-3 px-5">Weight</th>
            </tr>
          </thead>
          <tbody>
            {SECTORS.map(s => (
              <tr key={s.sector} className="border-b border-border/20 hover:bg-bg/30 transition-colors">
                <td className="py-2.5 px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-text-primary">{s.sector}</span>
                  </div>
                </td>
                {PERIODS.map(p => (
                  <td key={p} className={`text-right py-2.5 px-5 font-mono font-bold text-xs ${s[p] >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {s[p] >= 0 ? '+' : ''}{s[p].toFixed(1)}%
                  </td>
                ))}
                <td className="text-right py-2.5 px-5 font-mono text-text-muted">{s.weight}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-accent" /> AI Recommendations
          </h3>

          {AI_RECOMMENDATIONS.rotateInto.map(r => (
            <div key={r.sector} className="bg-surface border border-accent/20 rounded-xl p-5 animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-accent uppercase tracking-wider">Rotate Into</span>
              </div>
              <div className="text-lg font-black text-text-primary mb-2">{r.sector}</div>
              <p className="text-xs text-text-muted leading-relaxed">{r.reason}</p>
            </div>
          ))}

          {AI_RECOMMENDATIONS.rotateOutOf.map(r => (
            <div key={r.sector} className="bg-surface border border-danger/20 rounded-xl p-5 animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-danger" />
                <span className="text-xs font-bold text-danger uppercase tracking-wider">Rotate Out Of</span>
              </div>
              <div className="text-lg font-black text-text-primary mb-2">{r.sector}</div>
              <p className="text-xs text-text-muted leading-relaxed">{r.reason}</p>
            </div>
          ))}
        </div>

        {/* Pie chart */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Current Sector Weights</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0C0F1A', border: '1px solid #1A1F35', borderRadius: 8, fontSize: 11, color: '#F0F4F8' }}
                formatter={(v: number) => [`${v}%`, 'Weight']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {SECTORS.map(s => (
              <div key={s.sector} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-text-muted">{s.sector}</span>
                <span className="text-text-primary font-mono font-bold ml-auto">{s.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
