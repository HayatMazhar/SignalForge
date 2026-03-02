import { create } from 'zustand';
import type { StockQuote } from '../types';

interface PriceState {
  prices: Record<string, StockQuote>;
  updatePrice: (quote: StockQuote) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  updatePrice: (quote) =>
    set((state) => ({ prices: { ...state.prices, [quote.symbol]: quote } })),
}));
