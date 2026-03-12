using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SpeechController : ControllerBase
{
    private readonly IConfiguration _config;

    public SpeechController(IConfiguration config) => _config = config;

    [HttpGet("token")]
    public async Task<IActionResult> GetSpeechToken()
    {
        var key = _config["Speech:ApiKey"];
        var region = _config["Speech:Region"] ?? "swedencentral";

        if (string.IsNullOrEmpty(key))
            return BadRequest(new { error = "Speech service not configured" });

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", key);
        var response = await client.PostAsync(
            $"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken", null);

        if (!response.IsSuccessStatusCode)
            return StatusCode(502, new { error = "Failed to get speech token" });

        var token = await response.Content.ReadAsStringAsync();
        return Ok(new { token, region });
    }
}
