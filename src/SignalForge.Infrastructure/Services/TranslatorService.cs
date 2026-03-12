using Azure;
using Azure.AI.Translation.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SignalForge.Infrastructure.Services;

public sealed class TranslatorService
{
    private readonly TextTranslationClient? _client;
    private readonly ILogger<TranslatorService> _logger;

    public TranslatorService(IConfiguration config, ILogger<TranslatorService> logger)
    {
        _logger = logger;
        var key = config["Translator:ApiKey"];
        var region = config["Translator:Region"] ?? "swedencentral";
        if (!string.IsNullOrEmpty(key))
        {
            _client = new TextTranslationClient(new AzureKeyCredential(key), region);
        }
    }

    public bool IsAvailable => _client != null;

    public async Task<string> TranslateAsync(string text, string targetLanguage, CancellationToken ct = default)
    {
        if (_client == null || string.IsNullOrEmpty(text) || targetLanguage == "en")
            return text;

        try
        {
            var response = await _client.TranslateAsync(targetLanguage, text, cancellationToken: ct);
            var translation = response.Value.FirstOrDefault();
            return translation?.Translations?.FirstOrDefault()?.Text ?? text;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Translation to {Language} failed", targetLanguage);
            return text;
        }
    }

    public async Task<List<string>> TranslateBatchAsync(List<string> texts, string targetLanguage, CancellationToken ct = default)
    {
        if (_client == null || texts.Count == 0 || targetLanguage == "en")
            return texts;

        try
        {
            var response = await _client.TranslateAsync(targetLanguage, texts, cancellationToken: ct);
            return response.Value
                .Select(r => r.Translations?.FirstOrDefault()?.Text ?? "")
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Batch translation to {Language} failed", targetLanguage);
            return texts;
        }
    }

    public Task<List<SupportedLanguage>> GetSupportedLanguagesAsync(CancellationToken ct = default)
    {
        var languages = new List<SupportedLanguage>
        {
            new("en", "English", "English"),
            new("ar", "Arabic", "العربية"),
            new("es", "Spanish", "Español"),
            new("fr", "French", "Français"),
            new("de", "German", "Deutsch"),
            new("zh-Hans", "Chinese (Simplified)", "中文(简体)"),
            new("ja", "Japanese", "日本語"),
            new("ko", "Korean", "한국어"),
            new("hi", "Hindi", "हिन्दी"),
            new("pt", "Portuguese", "Português"),
            new("ru", "Russian", "Русский"),
            new("tr", "Turkish", "Türkçe"),
            new("it", "Italian", "Italiano"),
            new("nl", "Dutch", "Nederlands"),
            new("ur", "Urdu", "اردو"),
        };
        return Task.FromResult(languages);
    }
}

public record SupportedLanguage(string Code, string Name, string NativeName);
