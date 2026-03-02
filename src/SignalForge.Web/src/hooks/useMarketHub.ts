import { useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { useAuthStore } from '../stores/authStore';
import { usePriceStore } from '../stores/priceStore';
import { useSignalStore } from '../stores/signalStore';
import { useToastStore } from '../components/common/Toast';
import type { StockQuote, Signal } from '../types';

export function useMarketHub(symbols: string[]) {
  const connectionRef = useRef<HubConnection | null>(null);
  const token = useAuthStore((s) => s.token);
  const updatePrice = usePriceStore((s) => s.updatePrice);
  const addSignal = useSignalStore((s) => s.addSignal);
  const addToast = useToastStore((s) => s.add);

  useEffect(() => {
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/market', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('PriceUpdate', (quote: StockQuote) => {
      updatePrice(quote);
    });

    connection.on('NewSignal', (signal: Signal) => {
      addSignal(signal);
      addToast({
        type: 'signal',
        title: `${signal.type} Signal`,
        message: signal.reasoning.substring(0, 100),
        symbol: signal.symbol,
        signalType: signal.type,
      });
    });

    connection.on('AlertTriggered', (alert: { symbol: string; alertType: string; targetValue: number }) => {
      addToast({
        type: 'alert',
        title: 'Alert Triggered',
        message: `${alert.symbol} ${alert.alertType} alert hit target $${alert.targetValue}`,
        symbol: alert.symbol,
      });
    });

    connection
      .start()
      .then(() => {
        symbols.forEach((symbol) => {
          connection.invoke('SubscribeToStock', symbol);
        });
      })
      .catch(console.error);

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [token, symbols.join(',')]);

  return connectionRef;
}
