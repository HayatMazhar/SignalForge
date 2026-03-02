import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '../../api/insights';

const COLORS = [
  { min: 0, max: 25, color: '#EF4444', label: 'Extreme Fear' },
  { min: 25, max: 45, color: '#F97316', label: 'Fear' },
  { min: 45, max: 55, color: '#EAB308', label: 'Neutral' },
  { min: 55, max: 75, color: '#84CC16', label: 'Greed' },
  { min: 75, max: 100, color: '#00FF94', label: 'Extreme Greed' },
];

function getColor(score: number) {
  return COLORS.find(c => score >= c.min && score < c.max)?.color ?? '#64748B';
}

export default function FearGreedGauge() {
  const { data } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: insightsApi.getFearGreed,
    refetchInterval: 300000,
  });

  if (!data) return null;

  const angle = (data.score / 100) * 180 - 90;
  const color = getColor(data.score);

  const indicators = [
    { label: 'Momentum', value: data.momentum },
    { label: 'Market Breadth', value: data.breadth },
    { label: 'Put/Call Ratio', value: data.putCallRatio },
    { label: 'Volatility', value: data.volatility },
    { label: 'Safe Haven', value: data.safeHaven },
    { label: 'Junk Bond', value: data.junkBondDemand },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Fear & Greed Index</h2>

      <div className="flex flex-col items-center mb-6">
        <svg viewBox="0 0 200 120" className="w-48 h-28">
          {COLORS.map((c, i) => {
            const startAngle = (c.min / 100) * 180 - 90;
            const endAngle = (c.max / 100) * 180 - 90;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = 100 + 80 * Math.cos(startRad);
            const y1 = 100 + 80 * Math.sin(startRad);
            const x2 = 100 + 80 * Math.cos(endRad);
            const y2 = 100 + 80 * Math.sin(endRad);
            return (
              <path key={i} d={`M ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2}`}
                fill="none" stroke={c.color} strokeWidth="12" strokeLinecap="round" opacity="0.3" />
            );
          })}
          <line x1="100" y1="100" x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
            stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill={color} />
        </svg>

        <div className="text-center -mt-2">
          <div className="text-4xl font-black" style={{ color }}>{data.score}</div>
          <div className="text-sm font-bold" style={{ color }}>{data.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {indicators.map((ind) => (
          <div key={ind.label} className="bg-bg rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-muted">{ind.label}</span>
              <span className="text-xs font-bold text-text-primary">{ind.value}</span>
            </div>
            <div className="w-full bg-border rounded-full h-1">
              <div className="h-1 rounded-full transition-all duration-1000"
                style={{ width: `${ind.value}%`, backgroundColor: getColor(ind.value) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
