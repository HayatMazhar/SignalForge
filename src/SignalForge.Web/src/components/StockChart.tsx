import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, ColorType } from 'lightweight-charts';
import type { OhlcBar } from '../types';

interface StockChartProps {
  data: OhlcBar[];
  height?: number;
}

export default function StockChart({ data, height = 400 }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0F172A' },
        textColor: '#64748B',
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      width: containerRef.current.clientWidth,
      height,
      crosshair: {
        vertLine: { color: '#64748B', labelBackgroundColor: '#1E293B' },
        horzLine: { color: '#64748B', labelBackgroundColor: '#1E293B' },
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00FF94',
      downColor: '#EF4444',
      borderUpColor: '#00FF94',
      borderDownColor: '#EF4444',
      wickUpColor: '#00FF94',
      wickDownColor: '#EF4444',
    });

    candleSeries.setData(
      data.map((bar) => ({
        time: bar.date.split('T')[0],
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }))
    );

    const volumeSeries = chart.addHistogramSeries({
      color: '#1E293B',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      data.map((bar) => ({
        time: bar.date.split('T')[0],
        value: bar.volume,
        color: bar.close >= bar.open ? '#00FF9430' : '#EF444430',
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
