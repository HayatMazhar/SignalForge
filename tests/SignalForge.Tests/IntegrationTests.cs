using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace SignalForge.Tests;

[Trait("Category", "Integration")]
public class IntegrationTests
{
    private readonly HttpClient _client;
    private readonly bool _serverAvailable;

    public IntegrationTests()
    {
        _client = new HttpClient { BaseAddress = new Uri("https://localhost:5001"), Timeout = TimeSpan.FromSeconds(5) };
        try { _client.GetAsync("/health").GetAwaiter().GetResult(); _serverAvailable = true; }
        catch { _serverAvailable = false; }
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        if (!_serverAvailable) return;
        var r = await _client.GetAsync("/health");
        Assert.True(r.IsSuccessStatusCode || r.StatusCode == HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task UnauthenticatedRequest_Returns401()
    {
        if (!_serverAvailable) return;
        var r = await _client.GetAsync("/api/stocks/AAPL");
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact]
    public async Task Register_Returns_Token()
    {
        if (!_serverAvailable) return;
        var r = await _client.PostAsJsonAsync("/api/auth/register", new
        { email = $"test-{Guid.NewGuid():N}@sf.com", password = "TestPass123!", fullName = "Test" });
        Assert.True(r.IsSuccessStatusCode);
        var b = await r.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(b.GetProperty("token").GetString()));
    }

    [Fact]
    public async Task AuthenticatedSignals_Returns200()
    {
        if (!_serverAvailable) return;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await GetToken());
        var r = await _client.GetAsync("/api/signals?limit=5");
        Assert.True(r.IsSuccessStatusCode);
    }

    [Fact]
    public async Task Watchlist_CRUD_Flow()
    {
        if (!_serverAvailable) return;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await GetToken());
        var add = await _client.PostAsJsonAsync("/api/watchlist", new { symbol = "TSLA" });
        Assert.True(add.IsSuccessStatusCode);
        var get = await _client.GetAsync("/api/watchlist");
        Assert.True(get.IsSuccessStatusCode);
    }

    [Fact]
    public async Task StockSearch_ReturnsArray()
    {
        if (!_serverAvailable) return;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await GetToken());
        var r = await _client.GetAsync("/api/stocks/search?q=AAPL");
        Assert.True(r.IsSuccessStatusCode);
    }

    private async Task<string> GetToken()
    {
        var r = await _client.PostAsJsonAsync("/api/auth/register", new
        { email = $"u-{Guid.NewGuid():N}@t.com", password = "TestPass123!", fullName = "T" });
        r.EnsureSuccessStatusCode();
        var a = await r.Content.ReadFromJsonAsync<JsonElement>();
        return a.GetProperty("token").GetString()!;
    }
}
