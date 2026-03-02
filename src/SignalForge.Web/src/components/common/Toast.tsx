import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Bell, AlertTriangle } from 'lucide-react';
import { create } from 'zustand';

interface ToastItem {
  id: string;
  type: 'signal' | 'alert' | 'info' | 'error';
  title: string;
  message: string;
  symbol?: string;
  signalType?: 'Buy' | 'Sell' | 'Hold';
}

interface ToastState {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-5) }));
    playChime(toast.type);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function playChime(type: string) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.08;

    if (type === 'signal') {
      osc.frequency.value = 880;
      osc.type = 'sine';
    } else if (type === 'alert') {
      osc.frequency.value = 660;
      osc.type = 'triangle';
    } else {
      osc.frequency.value = 440;
      osc.type = 'sine';
    }

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported
  }
}

const typeStyles = {
  signal: { border: 'border-accent/50', icon: TrendingUp, iconColor: 'text-accent' },
  alert: { border: 'border-warning/50', icon: AlertTriangle, iconColor: 'text-warning' },
  info: { border: 'border-blue-400/50', icon: Bell, iconColor: 'text-blue-400' },
  error: { border: 'border-danger/50', icon: AlertTriangle, iconColor: 'text-danger' },
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => remove(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const style = typeStyles[toast.type];
  const Icon = style.icon;

  return (
    <div className={`bg-surface border ${style.border} rounded-xl p-4 shadow-2xl animate-slide-in backdrop-blur-sm`}>
      <div className="flex items-start gap-3">
        <div className={`${style.iconColor} mt-0.5`}>
          {toast.signalType === 'Sell' ? <TrendingDown className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">{toast.title}</span>
            {toast.symbol && <span className="text-xs font-bold text-accent">{toast.symbol}</span>}
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{toast.message}</p>
        </div>
        <button onClick={onDismiss} className="text-text-muted hover:text-text-primary flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
