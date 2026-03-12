import { useEffect, useRef, useMemo } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection, HubConnectionState } from '@microsoft/signalr';
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
  const symbolsKey = useMemo(() => symbols.join(','), [symbols]);

  useEffect(() => {
    if (!token || !symbolsKey) return;

    let cancelled = false;

    const apiBase = import.meta.env.VITE_API_URL || 'https://signalforge-api.ambitiouscliff-f7080230.eastus.azurecontainerapps.io/api';
    const hubUrl = apiBase.replace(/\/api\/?$/, '') + '/hubs/market';

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
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
        if (cancelled) {
          connection.stop();
          return;
        }
        symbols.forEach((symbol) => {
          connection.invoke('SubscribeToStock', symbol).catch(() => {});
        });
      })
      .catch(() => {});

    connectionRef.current = connection;

    return () => {
      cancelled = true;
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, [token, symbolsKey]);

  return connectionRef;
}
