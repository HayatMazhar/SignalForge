using Azure;
using Azure.AI.ContentSafety;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SignalForge.Infrastructure.Services;

public sealed class ContentSafetyService
{
    private readonly ContentSafetyClient? _client;
    private readonly ILogger<ContentSafetyService> _logger;

    public ContentSafetyService(IConfiguration config, ILogger<ContentSafetyService> logger)
    {
        _logger = logger;
        var endpoint = config["ContentSafety:Endpoint"];
        var key = config["ContentSafety:ApiKey"];
        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(key))
        {
            _client = new ContentSafetyClient(new Uri(endpoint), new AzureKeyCredential(key));
        }
    }

    public bool IsAvailable => _client != null;

    public async Task<ContentModerationResult> AnalyzeTextAsync(string text, CancellationToken ct = default)
    {
        if (_client == null)
            return new ContentModerationResult(false, null);

        try
        {
            var request = new AnalyzeTextOptions(text);
            var response = await _client.AnalyzeTextAsync(request, ct);

            var categories = response.Value.CategoriesAnalysis;
            var blocked = false;
            string? reason = null;

            foreach (var cat in categories)
            {
                if (cat.Severity >= 4)
                {
                    blocked = true;
                    reason = $"Content flagged for {cat.Category} (severity {cat.Severity})";
                    break;
                }
            }

            return new ContentModerationResult(blocked, reason);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Content Safety analysis failed");
            return new ContentModerationResult(false, null);
        }
    }
}

public record ContentModerationResult(bool IsBlocked, string? Reason);
