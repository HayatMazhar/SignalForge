using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace SignalForge.Infrastructure.Services;

/// <summary>
/// REST client for OpenAI-compatible chat/completions API (e.g. Core42 AI).
/// POST {baseUrl}chat/completions with api-key header.
/// </summary>
public sealed class Core42ChatClient
{
    private readonly HttpClient _http;
    private readonly string _model;
    private readonly int _maxTokens;
    private readonly double _temperature;

    public Core42ChatClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _model = config["Core42Ai:ModelName"] ?? "gpt-4o";
        _maxTokens = config.GetValue("Core42Ai:MaxTokens", 512);
        _temperature = config.GetValue("Core42Ai:Temperature", 0.7);
    }

    public static void Configure(HttpClient client, string baseUrl, string apiKey)
    {
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        client.DefaultRequestHeaders.Add("api-key", apiKey);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    /// <param name="messages">Role + content; role is "system", "user", or "assistant"</param>
    /// <param name="jsonResponse">When true, sends response_format: { "type": "json_object" }</param>
    /// <param name="maxTokensOverride">Optional override for this request</param>
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
        using var response = await _http.PostAsync("chat/completions", content, cancellationToken).ConfigureAwait(false);
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
