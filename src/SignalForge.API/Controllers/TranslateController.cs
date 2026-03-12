using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Infrastructure.Services;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TranslateController : ControllerBase
{
    private readonly TranslatorService _translator;

    public TranslateController(TranslatorService translator) => _translator = translator;

    [HttpPost]
    public async Task<IActionResult> Translate([FromBody] TranslateRequest request, CancellationToken ct)
    {
        if (!_translator.IsAvailable)
            return Ok(new { translatedText = request.Text, language = "en", supported = false });

        var translated = await _translator.TranslateAsync(request.Text, request.Language, ct);
        return Ok(new { translatedText = translated, language = request.Language, supported = true });
    }

    [HttpPost("batch")]
    public async Task<IActionResult> TranslateBatch([FromBody] TranslateBatchRequest request, CancellationToken ct)
    {
        if (!_translator.IsAvailable)
            return Ok(new { translations = request.Texts, language = "en", supported = false });

        var translated = await _translator.TranslateBatchAsync(request.Texts, request.Language, ct);
        return Ok(new { translations = translated, language = request.Language, supported = true });
    }

    [HttpGet("languages")]
    public async Task<IActionResult> GetLanguages(CancellationToken ct)
    {
        var languages = await _translator.GetSupportedLanguagesAsync(ct);
        return Ok(languages);
    }
}

public record TranslateRequest(string Text, string Language);
public record TranslateBatchRequest(List<string> Texts, string Language);
