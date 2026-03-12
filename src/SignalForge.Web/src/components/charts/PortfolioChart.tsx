import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PortfolioChartProps {
  positions: { symbol: string; quantity: number; averageCost: number }[];
}

export default function PortfolioChart({ positions }: PortfolioChartProps) {
  const totalValue = positions.reduce((s, p) => s + p.quantity * p.averageCost, 0);

  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dayVariation = Math.sin(i * 0.3) * 0.02 + (i / 29) * 0.05;
    const noise = (Math.random() - 0.5) * 0.015;
    const value = totalValue * (1 + dayVariation + noise);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
    };
  });

  if (totalValue === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Portfolio Value</h2>
        <p className="text-text-muted text-sm text-center py-8">Add positions to see your portfolio chart</p>
      </div>
    );
  }

  const currentValue = data[data.length - 1].value;
  const startValue = data[0].value;
  const change = currentValue - startValue;
  const changePct = (change / startValue) * 100;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Portfolio Value</h2>
          <div className="text-2xl font-bold text-text-primary mt-1">${currentValue.toLocaleString()}</div>
        </div>
        <div className={`text-right ${change >= 0 ? 'text-accent' : 'text-danger'}`}>
          <div className="text-sm font-bold">{change >= 0 ? '+' : ''}{changePct.toFixed(2)}%</div>
          <div className="text-xs">{change >= 0 ? '+' : ''}${change.toFixed(2)} (30d)</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={change >= 0 ? '#00FF94' : '#EF4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={change >= 0 ? '#00FF94' : '#EF4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
          />
          <Area type="monotone" dataKey="value" stroke={change >= 0 ? '#00FF94' : '#EF4444'} fill="url(#portfolioGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
