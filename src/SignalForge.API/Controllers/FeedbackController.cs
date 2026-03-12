using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.Interfaces;
using System.Security.Claims;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ILogger<FeedbackController> _logger;

    public FeedbackController(IApplicationDbContext db, ILogger<FeedbackController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        _logger.LogInformation("Feedback from {UserId}: [{Category}] Rating={Rating} - {Message}",
            userId, request.Category, request.Rating, request.Message);
        return Ok(new { success = true, message = "Thank you for your feedback!" });
    }
}

public record FeedbackRequest(int Rating, string Category, string Message);
