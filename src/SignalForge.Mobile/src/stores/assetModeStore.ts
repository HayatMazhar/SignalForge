import { create } from 'zustand';

type AssetMode = 'stocks' | 'crypto';

interface AssetModeState {
  mode: AssetMode;
  setMode: (mode: AssetMode) => void;
  toggle: () => void;
  apiPrefix: string;
}

export const useAssetModeStore = create<AssetModeState>((set, get) => ({
  mode: 'stocks',
  setMode: (mode) => set({ mode, apiPrefix: mode === 'crypto' ? '/crypto' : '/stocks' }),
  toggle: () => {
    const next = get().mode === 'stocks' ? 'crypto' : 'stocks';
    set({ mode: next, apiPrefix: next === 'crypto' ? '/crypto' : '/stocks' });
  },
  apiPrefix: '/stocks',
}));
