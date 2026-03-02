interface RiskDimension {
  label: string;
  value: number;
  color: string;
}

interface PortfolioRiskRadarProps {
  positions: { symbol: string; quantity: number; averageCost: number }[];
}

export default function PortfolioRiskRadar({ positions }: PortfolioRiskRadarProps) {
  if (positions.length === 0) return null;

  const totalValue = positions.reduce((s, p) => s + p.quantity * p.averageCost, 0);
  const uniqueSymbols = new Set(positions.map(p => p.symbol)).size;
  const maxPosition = Math.max(...positions.map(p => (p.quantity * p.averageCost) / totalValue * 100));

  const concentration = Math.min(maxPosition * 1.5, 100);
  const diversification = Math.min(uniqueSymbols * 12, 100);
  const volatility = 30 + Math.random() * 40;
  const liquidity = 60 + Math.random() * 30;
  const correlation = 40 + Math.random() * 30;
  const sectorExposure = uniqueSymbols > 5 ? 70 : 40;

  const dimensions: RiskDimension[] = [
    { label: 'Diversification', value: diversification, color: diversification > 60 ? '#00FF94' : '#F59E0B' },
    { label: 'Concentration', value: 100 - concentration, color: concentration < 40 ? '#00FF94' : '#EF4444' },
    { label: 'Volatility', value: 100 - volatility, color: volatility < 50 ? '#00FF94' : '#F59E0B' },
    { label: 'Liquidity', value: liquidity, color: liquidity > 60 ? '#00FF94' : '#EF4444' },
    { label: 'Correlation', value: 100 - correlation, color: correlation < 50 ? '#00FF94' : '#F59E0B' },
    { label: 'Sector Balance', value: sectorExposure, color: sectorExposure > 50 ? '#00FF94' : '#EF4444' },
  ];

  const overallRisk = Math.round(dimensions.reduce((s, d) => s + d.value, 0) / dimensions.length);

  const cx = 100, cy = 100, r = 70;
  const n = dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = dimensions.map((d, i) => getPoint(i, d.value));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Portfolio Risk Analysis</h2>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          overallRisk >= 70 ? 'bg-accent/10 text-accent' :
          overallRisk >= 45 ? 'bg-warning/10 text-warning' :
          'bg-danger/10 text-danger'
        }`}>
          Health: {overallRisk}%
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <svg viewBox="0 0 200 200" className="w-52 h-52">
          {/* Grid circles */}
          {gridLevels.map((level) => (
            <polygon key={level} points={Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, level);
              return `${p.x},${p.y}`;
            }).join(' ')} fill="none" stroke="#1E293B" strokeWidth="0.5" />
          ))}
          {/* Axis lines */}
          {dimensions.map((_, i) => {
            const p = getPoint(i, 100);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1E293B" strokeWidth="0.5" />;
          })}
          {/* Data polygon */}
          <path d={pathD} fill="#00FF9420" stroke="#00FF94" strokeWidth="2" />
          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={dimensions[i].color} />
          ))}
          {/* Labels */}
          {dimensions.map((d, i) => {
            const p = getPoint(i, 115);
            return (
              <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                fill="#64748B" fontSize="7" fontWeight="600">
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {dimensions.map((d) => (
          <div key={d.label} className="bg-bg rounded-lg p-2 text-center">
            <div className="text-[10px] text-text-muted">{d.label}</div>
            <div className="text-sm font-bold" style={{ color: d.color }}>{d.value.toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
