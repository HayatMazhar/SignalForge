using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SignalForge.Infrastructure.Identity;

namespace SignalForge.API.Middleware;

[AttributeUsage(AttributeTargets.Method)]
public class RequiresTierAttribute : Attribute
{
    public string[] AllowedTiers { get; }
    public RequiresTierAttribute(params string[] tiers) => AllowedTiers = tiers;
}

public class SubscriptionTierFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        return await next(context);
    }
}

public static class TierLimits
{
    public static readonly Dictionary<string, TierConfig> Config = new()
    {
        ["free"] = new(MaxWatchlist: 5, MaxAlerts: 3, SignalDelayMinutes: 15, CanAccessOptionsFlow: false, CanGenerateSignals: false),
        ["pro"] = new(MaxWatchlist: 50, MaxAlerts: 25, SignalDelayMinutes: 0, CanAccessOptionsFlow: true, CanGenerateSignals: true),
        ["elite"] = new(MaxWatchlist: int.MaxValue, MaxAlerts: int.MaxValue, SignalDelayMinutes: 0, CanAccessOptionsFlow: true, CanGenerateSignals: true),
    };

    public static TierConfig GetConfig(string tier) =>
        Config.TryGetValue(tier.ToLowerInvariant(), out var cfg) ? cfg : Config["free"];
}

public record TierConfig(
    int MaxWatchlist,
    int MaxAlerts,
    int SignalDelayMinutes,
    bool CanAccessOptionsFlow,
    bool CanGenerateSignals
);
