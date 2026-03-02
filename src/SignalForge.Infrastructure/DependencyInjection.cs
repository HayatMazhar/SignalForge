using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SignalForge.Application.Interfaces;
using SignalForge.Infrastructure.BackgroundServices;
using SignalForge.Infrastructure.Data;
using SignalForge.Infrastructure.Identity;
using SignalForge.Infrastructure.Services;
using StackExchange.Redis;

namespace SignalForge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("SignalForge-InMemory"));
        }
        else
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));
        }

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 8;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        var redisConnectionStr = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConnectionStr))
        {
            services.AddSingleton<IConnectionMultiplexer>(sp =>
            {
                var opts = ConfigurationOptions.Parse(redisConnectionStr);
                opts.AbortOnConnectFail = false;
                opts.ConnectTimeout = 3000;
                return ConnectionMultiplexer.Connect(opts);
            });
            services.AddScoped<ICacheService, RedisCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, NoOpCacheService>();
        }

        services.AddScoped<IAuthService, AuthService>();

        services.AddHttpClient<IMarketDataService, PolygonMarketDataService>();
        services.AddHttpClient<INewsService, NewsApiService>();
        services.AddHttpClient<IOptionsFlowService, UnusualWhalesService>();
        services.AddScoped<IAISignalService, OpenAISignalService>();

        services.AddHostedService<SignalGeneratorService>();
        services.AddHostedService<PriceTickerService>();

        return services;
    }
}

public class NoOpCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default) => Task.FromResult(default(T));
    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken ct = default) => Task.CompletedTask;
    public Task RemoveAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}
