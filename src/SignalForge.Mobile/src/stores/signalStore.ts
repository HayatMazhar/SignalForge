import { create } from 'zustand';
import type { Signal } from '../api/stocks';

interface SignalState {
  signals: Signal[];
  setSignals: (signals: Signal[]) => void;
  addSignal: (signal: Signal) => void;
}

export const useSignalStore = create<SignalState>((set) => ({
  signals: [],
  setSignals: (signals) => set({ signals }),
  addSignal: (signal) => set((s) => ({ signals: [signal, ...s.signals].slice(0, 100) })),
}));
