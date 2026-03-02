import { create } from 'zustand';
import type { Signal } from '../types';

interface SignalState {
  signals: Signal[];
  setSignals: (signals: Signal[]) => void;
  addSignal: (signal: Signal) => void;
}

export const useSignalStore = create<SignalState>((set) => ({
  signals: [],
  setSignals: (signals) => set({ signals }),
  addSignal: (signal) => set((state) => ({ signals: [signal, ...state.signals].slice(0, 100) })),
}));
