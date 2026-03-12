import { create } from 'zustand';

interface WatchlistState {
  symbols: string[];
  setSymbols: (symbols: string[]) => void;
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  symbols: [],
  setSymbols: (symbols) => set({ symbols }),
  add: (symbol) => set((s) => ({ symbols: [...s.symbols, symbol] })),
  remove: (symbol) => set((s) => ({ symbols: s.symbols.filter((x) => x !== symbol) })),
}));
