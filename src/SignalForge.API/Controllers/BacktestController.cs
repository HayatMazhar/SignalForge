using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BacktestController : ControllerBase
{
    private readonly IMarketDataService _marketData;

    public BacktestController(IMarketDataService marketData) => _marketData = marketData;

    [HttpPost]
    public async Task<IActionResult> RunBacktest([FromBody] BacktestRequestDto request, CancellationToken ct)
    {
        var to = DateTime.UtcNow;
        var from = to.AddDays(-request.LookbackDays);
        var bars = await _marketData.GetHistory(request.Symbol.ToUpperInvariant(), from, to, ct);

        if (bars.Count < 20)
            return BadRequest(new { error = "Not enough historical data for backtesting" });

        var result = request.Strategy switch
        {
            "RSI" => RunRsiStrategy(request, bars),
            "MACD" => RunMacdStrategy(request, bars),
            "SMA_Cross" => RunSmaCrossStrategy(request, bars),
            "Mean_Reversion" => RunMeanReversionStrategy(request, bars),
            _ => RunRsiStrategy(request, bars),
        };

        return Ok(result);
    }

    [HttpGet("strategies")]
    public IActionResult GetStrategies()
    {
        return Ok(new[]
        {
            new { id = "RSI", name = "RSI Oversold/Overbought", description = "Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought)", defaultParams = new { stopLoss = 3.0, takeProfit = 8.0 } },
            new { id = "MACD", name = "MACD Crossover", description = "Buy on bullish MACD crossover, sell on bearish crossover", defaultParams = new { stopLoss = 2.5, takeProfit = 6.0 } },
            new { id = "SMA_Cross", name = "SMA 20/50 Crossover", description = "Buy when 20-SMA crosses above 50-SMA, sell on reverse", defaultParams = new { stopLoss = 4.0, takeProfit = 10.0 } },
            new { id = "Mean_Reversion", name = "Bollinger Mean Reversion", description = "Buy at lower Bollinger Band, sell at upper band", defaultParams = new { stopLoss = 3.0, takeProfit = 5.0 } },
        });
    }

    private static BacktestResultDto RunRsiStrategy(BacktestRequestDto req, List<OhlcBarDto> bars)
    {
        var trades = new List<BacktestTradeDto>();
        var equity = new List<BacktestEquityPointDto>();
        decimal capital = req.InitialCapital;
        decimal peak = capital;
        decimal maxDD = 0;
        bool inPosition = false;
        decimal entryPrice = 0;
        string entryDate = "";

        for (int i = 14; i < bars.Count; i++)
        {
            var rsi = CalcRsi(bars, i, 14);
            var price = bars[i].Close;
            var date = bars[i].Date.ToString("o");

            if (!inPosition && rsi < 30)
            {
                inPosition = true;
                entryPrice = price;
                entryDate = date;
            }
            else if (inPosition)
            {
                var pnlPct = (price - entryPrice) / entryPrice * 100;
                if (rsi > 70 || pnlPct <= -req.StopLossPercent || pnlPct >= req.TakeProfitPercent)
                {
                    var pnl = (price - entryPrice) / entryPrice * capital * 0.1m;
                    capital += pnl;
                    trades.Add(new("Long", entryPrice, price, Math.Round(pnl, 2), Math.Round(pnlPct, 2), entryDate, date,
                        rsi > 70 ? "RSI Overbought" : pnlPct <= -req.StopLossPercent ? "Stop Loss" : "Take Profit"));
                    inPosition = false;
                }
            }

            peak = Math.Max(peak, capital);
            var dd = peak > 0 ? (peak - capital) / peak * 100 : 0;
            maxDD = Math.Max(maxDD, dd);
            equity.Add(new(date, Math.Round(capital, 2), Math.Round(dd, 2)));
        }

        return BuildResult(req, capital, trades, equity, maxDD);
    }

    private static BacktestResultDto RunMacdStrategy(BacktestRequestDto req, List<OhlcBarDto> bars)
    {
        var trades = new List<BacktestTradeDto>();
        var equity = new List<BacktestEquityPointDto>();
        decimal capital = req.InitialCapital;
        decimal peak = capital, maxDD = 0;
        bool inPosition = false;
        decimal entryPrice = 0;
        string entryDate = "";

        var closes = bars.Select(b => b.Close).ToList();

        for (int i = 26; i < bars.Count; i++)
        {
            var ema12 = CalcEma(closes, i, 12);
            var ema26 = CalcEma(closes, i, 26);
            var macd = ema12 - ema26;
            var prevEma12 = CalcEma(closes, i - 1, 12);
            var prevEma26 = CalcEma(closes, i - 1, 26);
            var prevMacd = prevEma12 - prevEma26;
            var price = bars[i].Close;
            var date = bars[i].Date.ToString("o");

            if (!inPosition && macd > 0 && prevMacd <= 0)
            {
                inPosition = true; entryPrice = price; entryDate = date;
            }
            else if (inPosition)
            {
                var pnlPct = (price - entryPrice) / entryPrice * 100;
                if ((macd < 0 && prevMacd >= 0) || pnlPct <= -req.StopLossPercent || pnlPct >= req.TakeProfitPercent)
                {
                    var pnl = (price - entryPrice) / entryPrice * capital * 0.1m;
                    capital += pnl;
                    trades.Add(new("Long", entryPrice, price, Math.Round(pnl, 2), Math.Round(pnlPct, 2), entryDate, date,
                        pnlPct <= -req.StopLossPercent ? "Stop Loss" : pnlPct >= req.TakeProfitPercent ? "Take Profit" : "MACD Bearish Cross"));
                    inPosition = false;
                }
            }

            peak = Math.Max(peak, capital);
            var dd = peak > 0 ? (peak - capital) / peak * 100 : 0;
            maxDD = Math.Max(maxDD, dd);
            equity.Add(new(date, Math.Round(capital, 2), Math.Round(dd, 2)));
        }

        return BuildResult(req, capital, trades, equity, maxDD);
    }

    private static BacktestResultDto RunSmaCrossStrategy(BacktestRequestDto req, List<OhlcBarDto> bars)
    {
        var trades = new List<BacktestTradeDto>();
        var equity = new List<BacktestEquityPointDto>();
        decimal capital = req.InitialCapital;
        decimal peak = capital, maxDD = 0;
        bool inPosition = false;
        decimal entryPrice = 0;
        string entryDate = "";

        for (int i = 50; i < bars.Count; i++)
        {
            var sma20 = bars.Skip(i - 19).Take(20).Average(b => b.Close);
            var sma50 = bars.Skip(i - 49).Take(50).Average(b => b.Close);
            var prevSma20 = bars.Skip(i - 20).Take(20).Average(b => b.Close);
            var prevSma50 = bars.Skip(i - 50).Take(50).Average(b => b.Close);
            var price = bars[i].Close;
            var date = bars[i].Date.ToString("o");

            if (!inPosition && sma20 > sma50 && prevSma20 <= prevSma50)
            {
                inPosition = true; entryPrice = price; entryDate = date;
            }
            else if (inPosition)
            {
                var pnlPct = (price - entryPrice) / entryPrice * 100;
                if ((sma20 < sma50 && prevSma20 >= prevSma50) || pnlPct <= -req.StopLossPercent || pnlPct >= req.TakeProfitPercent)
                {
                    var pnl = (price - entryPrice) / entryPrice * capital * 0.1m;
                    capital += pnl;
                    trades.Add(new("Long", entryPrice, price, Math.Round(pnl, 2), Math.Round(pnlPct, 2), entryDate, date,
                        pnlPct <= -req.StopLossPercent ? "Stop Loss" : pnlPct >= req.TakeProfitPercent ? "Take Profit" : "Death Cross"));
                    inPosition = false;
                }
            }

            peak = Math.Max(peak, capital);
            var dd = peak > 0 ? (peak - capital) / peak * 100 : 0;
            maxDD = Math.Max(maxDD, dd);
            equity.Add(new(date, Math.Round(capital, 2), Math.Round(dd, 2)));
        }

        return BuildResult(req, capital, trades, equity, maxDD);
    }

    private static BacktestResultDto RunMeanReversionStrategy(BacktestRequestDto req, List<OhlcBarDto> bars)
    {
        var trades = new List<BacktestTradeDto>();
        var equity = new List<BacktestEquityPointDto>();
        decimal capital = req.InitialCapital;
        decimal peak = capital, maxDD = 0;
        bool inPosition = false;
        decimal entryPrice = 0;
        string entryDate = "";

        for (int i = 20; i < bars.Count; i++)
        {
            var window = bars.Skip(i - 19).Take(20).Select(b => b.Close).ToList();
            var sma = window.Average();
            var std = (decimal)Math.Sqrt((double)window.Average(v => (v - sma) * (v - sma)));
            var upper = sma + 2 * std;
            var lower = sma - 2 * std;
            var price = bars[i].Close;
            var date = bars[i].Date.ToString("o");

            if (!inPosition && price <= lower)
            {
                inPosition = true; entryPrice = price; entryDate = date;
            }
            else if (inPosition)
            {
                var pnlPct = (price - entryPrice) / entryPrice * 100;
                if (price >= upper || price >= sma || pnlPct <= -req.StopLossPercent || pnlPct >= req.TakeProfitPercent)
                {
                    var pnl = (price - entryPrice) / entryPrice * capital * 0.1m;
                    capital += pnl;
                    trades.Add(new("Long", entryPrice, price, Math.Round(pnl, 2), Math.Round(pnlPct, 2), entryDate, date,
                        price >= upper ? "Upper Band" : pnlPct <= -req.StopLossPercent ? "Stop Loss" : pnlPct >= req.TakeProfitPercent ? "Take Profit" : "Mean Reversion"));
                    inPosition = false;
                }
            }

            peak = Math.Max(peak, capital);
            var dd = peak > 0 ? (peak - capital) / peak * 100 : 0;
            maxDD = Math.Max(maxDD, dd);
            equity.Add(new(date, Math.Round(capital, 2), Math.Round(dd, 2)));
        }

        return BuildResult(req, capital, trades, equity, maxDD);
    }

    private static BacktestResultDto BuildResult(BacktestRequestDto req, decimal capital, List<BacktestTradeDto> trades, List<BacktestEquityPointDto> equity, decimal maxDD)
    {
        var wins = trades.Count(t => t.PnL > 0);
        var losses = trades.Count(t => t.PnL <= 0);
        var totalReturn = capital - req.InitialCapital;
        var grossProfit = trades.Where(t => t.PnL > 0).Sum(t => t.PnL);
        var grossLoss = Math.Abs(trades.Where(t => t.PnL < 0).Sum(t => t.PnL));
        var profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
        var returns = trades.Select(t => t.PnLPercent).ToList();
        var avgReturn = returns.Count > 0 ? returns.Average() : 0;
        var stdReturn = returns.Count > 1 ? (decimal)Math.Sqrt((double)returns.Average(r => (r - avgReturn) * (r - avgReturn))) : 1;
        var sharpe = stdReturn > 0 ? avgReturn / stdReturn * (decimal)Math.Sqrt(252) : 0;

        return new BacktestResultDto(req.Symbol.ToUpperInvariant(), req.Strategy, req.InitialCapital,
            Math.Round(capital, 2), Math.Round(totalReturn, 2), Math.Round(totalReturn / req.InitialCapital * 100, 2),
            trades.Count, wins, losses,
            trades.Count > 0 ? Math.Round((decimal)wins / trades.Count * 100, 1) : 0,
            Math.Round(maxDD, 2), Math.Round(sharpe, 2), Math.Round(profitFactor, 2),
            trades, equity);
    }

    private static decimal CalcRsi(List<OhlcBarDto> bars, int idx, int period)
    {
        decimal gain = 0, loss = 0;
        for (int i = idx - period + 1; i <= idx; i++)
        {
            var diff = bars[i].Close - bars[i - 1].Close;
            if (diff > 0) gain += diff; else loss += Math.Abs(diff);
        }
        var avgGain = gain / period;
        var avgLoss = loss / period;
        if (avgLoss == 0) return 100;
        return 100 - 100 / (1 + avgGain / avgLoss);
    }

    private static decimal CalcEma(List<decimal> data, int idx, int period)
    {
        var mult = 2.0m / (period + 1);
        var start = Math.Max(0, idx - period * 3);
        var ema = data.Skip(start).Take(period).Average();
        for (int i = start + period; i <= idx; i++)
            ema = (data[i] - ema) * mult + ema;
        return ema;
    }
}
