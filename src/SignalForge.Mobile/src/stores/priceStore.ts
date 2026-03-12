import { create } from 'zustand';
import type { StockQuote } from '../api/stocks';

interface PriceState {
  prices: Record<string, StockQuote>;
  updatePrice: (quote: StockQuote) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  updatePrice: (quote) => set((s) => ({ prices: { ...s.prices, [quote.symbol]: quote } })),
}));
