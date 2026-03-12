export function getSignalLabel(type: string | number): 'Buy' | 'Sell' | 'Hold' {
  const t = String(type);
  if (t === 'Buy' || t === '0') return 'Buy';
  if (t === 'Sell' || t === '1') return 'Sell';
  return 'Hold';
}
