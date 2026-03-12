using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace SignalForge.Infrastructure.Services;

/// <summary>
/// REST client for OpenAI-compatible chat/completions API.
/// Supports Azure OpenAI (api-version query param + deployment-based URL) and
/// other OpenAI-compatible providers (Core42, OpenAI, etc.).
/// </summary>
public sealed class Core42ChatClient
{
    private readonly HttpClient _http;
    private readonly string _model;
    private readonly int _maxTokens;
    private readonly double _temperature;
    private readonly string _completionsPath;

    public Core42ChatClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _model = config["Core42Ai:ModelName"] ?? "gpt-4o-mini";
        _maxTokens = config.GetValue("Core42Ai:MaxTokens", 512);
        _temperature = config.GetValue("Core42Ai:Temperature", 0.7);

        var apiVersion = config["Core42Ai:ApiVersion"];
        var deploymentName = config["Core42Ai:DeploymentName"] ?? _model;
        var endpoint = config["Core42Ai:ApiEndpoint"] ?? "";

        if (!string.IsNullOrEmpty(apiVersion) || endpoint.Contains(".cognitive.microsoft.com", StringComparison.OrdinalIgnoreCase))
        {
            var ver = apiVersion ?? "2024-12-01-preview";
            _completionsPath = $"openai/deployments/{deploymentName}/chat/completions?api-version={ver}";
        }
        else
        {
            _completionsPath = "chat/completions";
        }
    }

    public static void Configure(HttpClient client, string baseUrl, string apiKey)
    {
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        client.DefaultRequestHeaders.Add("api-key", apiKey);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<string> CompleteAsync(
        IReadOnlyList<(string Role, string Content)> messages,
        bool jsonResponse = false,
        int? maxTokensOverride = null,
        CancellationToken cancellationToken = default)
    {
        var payload = new Dictionary<string, object>
        {
            ["model"] = _model,
            ["messages"] = messages.Select(m => new { role = m.Role.ToLowerInvariant(), content = m.Content }).ToList(),
            ["max_tokens"] = maxTokensOverride ?? _maxTokens,
            ["temperature"] = _temperature,
        };
        if (jsonResponse)
            payload["response_format"] = new { type = "json_object" };

        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        using var response = await _http.PostAsync(_completionsPath, content, cancellationToken).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        var doc = JsonDocument.Parse(responseJson);
        var choices = doc.RootElement.GetProperty("choices");
        if (choices.GetArrayLength() == 0)
            throw new InvalidOperationException("No choices in chat completion response.");
        var first = choices[0];
        var message = first.GetProperty("message");
        var text = message.GetProperty("content").GetString();
        return text ?? string.Empty;
    }
}
