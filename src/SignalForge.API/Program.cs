using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using Hangfire;
using Hangfire.InMemory;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using SignalForge.Application.Commands.Signals;
using SignalForge.Application.Mappings;
using SignalForge.API.Middleware;
using SignalForge.Infrastructure;
using SignalForge.Infrastructure.BackgroundServices;
using SignalForge.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers()
    .AddJsonOptions(opts => opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Issuer"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddSignalR();

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(GenerateSignalCommand).Assembly));
builder.Services.AddValidatorsFromAssembly(typeof(GenerateSignalCommand).Assembly);
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<Microsoft.AspNetCore.Authentication.AuthenticationOptions>(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
});

builder.Services.AddHangfire(config => config.UseInMemoryStorage());
builder.Services.AddHangfireServer();

var healthChecks = builder.Services.AddHealthChecks();
var healthCheckTimeout = TimeSpan.FromSeconds(5);
var sqlConn = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(sqlConn))
    healthChecks.AddSqlServer(sqlConn, name: "sqlserver", tags: ["db"], timeout: healthCheckTimeout);
var redisConn = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConn))
    healthChecks.AddRedis(redisConn, name: "redis", tags: ["cache"]);

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddCors(options =>
{
    var allowedOrigins = new List<string>
    {
        "http://localhost:5173", "http://localhost:8081", "http://localhost:8082",
        "http://10.40.50.72:8081", "http://10.40.50.72:5173",
        "https://nice-ground-055efc20f.1.azurestaticapps.net",
        "https://hayatmazhar.github.io"
    };
    var extraOrigins = builder.Configuration["Cors:Origins"];
    if (!string.IsNullOrEmpty(extraOrigins))
        allowedOrigins.AddRange(extraOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin)) return false;
            if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)) return true;
            if (origin.EndsWith(".azurestaticapps.net", StringComparison.OrdinalIgnoreCase)) return true;
            if (origin.Equals("https://hayatmazhar.github.io", StringComparison.OrdinalIgnoreCase) ||
                origin.StartsWith("https://hayatmazhar.github.io/", StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHangfireDashboard("/hangfire");
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }
    await next();
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MarketHub>("/hubs/market");
app.MapGet("/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }));
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsJsonAsync(result);
    }
});

await DataSeeder.SeedAsync(app.Services);

app.Run();

public partial class Program { }
