using Microsoft.AspNetCore.Identity;

namespace SignalForge.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string Tier { get; set; } = "free";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
