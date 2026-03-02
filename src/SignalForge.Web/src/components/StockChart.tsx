import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
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
        background: { type: ColorType.Solid, color: '#0C0F1A' },
        textColor: '#5B6378',
      },
      grid: {
        vertLines: { color: '#1A1F35' },
        horzLines: { color: '#1A1F35' },
      },
      width: containerRef.current.clientWidth,
      height,
      crosshair: {
        vertLine: { color: '#5B6378', labelBackgroundColor: '#1A1F35' },
        horzLine: { color: '#5B6378', labelBackgroundColor: '#1A1F35' },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF94',
      downColor: '#FF3B5C',
      borderUpColor: '#00FF94',
      borderDownColor: '#FF3B5C',
      wickUpColor: '#00FF94',
      wickDownColor: '#FF3B5C',
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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#1A1F35',
      priceFormat: { type: 'volume' as const },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      data.map((bar) => ({
        time: bar.date.split('T')[0],
        value: bar.volume,
        color: bar.close >= bar.open ? '#00FF9430' : '#FF3B5C30',
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
