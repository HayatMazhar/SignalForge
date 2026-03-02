export function getSignalLabel(type: string | number): 'Buy' | 'Sell' | 'Hold' {
  const t = String(type);
  if (t === 'Buy' || t === '0') return 'Buy';
  if (t === 'Sell' || t === '1') return 'Sell';
  return 'Hold';
}

export function isBuy(type: string | number): boolean {
  return getSignalLabel(type) === 'Buy';
}

export function isSell(type: string | number): boolean {
  return getSignalLabel(type) === 'Sell';
}
