import { useEffect, useRef, useMemo } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection, HubConnectionState } from '@microsoft/signalr';
import { useAuthStore } from '../stores/authStore';
import { usePriceStore } from '../stores/priceStore';
import { useSignalStore } from '../stores/signalStore';
import { API_BASE_URL } from '../constants/config';
import * as Haptics from 'expo-haptics';

export function useSignalR(symbols: string[]) {
  const connectionRef = useRef<HubConnection | null>(null);
  const token = useAuthStore((s) => s.token);
  const updatePrice = usePriceStore((s) => s.updatePrice);
  const addSignal = useSignalStore((s) => s.addSignal);
  const symbolsKey = useMemo(() => symbols.join(','), [symbols]);

  useEffect(() => {
    if (!token || !symbolsKey) return;

    let cancelled = false;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/market`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('PriceUpdate', (quote: any) => {
      updatePrice(quote);
    });

    connection.on('NewSignal', (signal: any) => {
      addSignal(signal);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    connection.on('AlertTriggered', () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
