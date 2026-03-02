using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.Interfaces;
using SignalForge.Infrastructure.Identity;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IApplicationDbContext _db;

    public AdminController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IApplicationDbContext db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetSystemStats(CancellationToken ct)
    {
        var totalUsers = await _userManager.Users.CountAsync(ct);
        var totalStocks = await _db.Stocks.CountAsync(ct);
        var totalSignals = await _db.Signals.CountAsync(ct);
        var totalAlerts = await _db.Alerts.CountAsync(ct);
        var totalWatchlist = await _db.UserWatchlists.CountAsync(ct);
        var totalPortfolio = await _db.Portfolios.CountAsync(ct);
        var signalsToday = await _db.Signals.CountAsync(s => s.GeneratedAt >= DateTime.UtcNow.Date, ct);

        var tierBreakdown = await _userManager.Users
            .GroupBy(u => u.Tier)
            .Select(g => new { Tier = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return Ok(new
        {
            totalUsers,
            totalStocks,
            totalSignals,
            totalAlerts,
            totalWatchlist,
            totalPortfolio,
            signalsToday,
            tierBreakdown,
            serverTime = DateTime.UtcNow,
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken ct)
    {
        var users = await _userManager.Users.ToListAsync(ct);
        var result = new List<object>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.Tier,
                Roles = roles,
                u.EmailConfirmed,
                u.LockoutEnd,
                IsLocked = u.LockoutEnd > DateTimeOffset.UtcNow,
                u.CreatedAt,
            });
        }
        return Ok(result);
    }

    [HttpPut("users/{userId}/role")]
    public async Task<IActionResult> AssignRole(string userId, [FromBody] RoleAssignRequest request, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, request.Role);
        return Ok(new { message = $"User {user.Email} assigned role {request.Role}" });
    }

    [HttpPut("users/{userId}/tier")]
    public async Task<IActionResult> UpdateTier(string userId, [FromBody] TierUpdateRequest request, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        user.Tier = request.Tier;
        await _userManager.UpdateAsync(user);
        return Ok(new { message = $"User {user.Email} tier updated to {request.Tier}" });
    }

    [HttpPut("users/{userId}/lock")]
    public async Task<IActionResult> LockUser(string userId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        return Ok(new { message = $"User {user.Email} locked" });
    }

    [HttpPut("users/{userId}/unlock")]
    public async Task<IActionResult> UnlockUser(string userId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        await _userManager.SetLockoutEndDateAsync(user, null);
        return Ok(new { message = $"User {user.Email} unlocked" });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var roles = await _roleManager.Roles.ToListAsync(ct);
        var result = new List<object>();
        foreach (var r in roles)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(r.Name!);
            result.Add(new { r.Id, r.Name, UserCount = usersInRole.Count, Permissions = GetRolePermissions(r.Name!) });
        }
        return Ok(result);
    }

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        if (await _roleManager.RoleExistsAsync(request.Name))
            return BadRequest(new { error = "Role already exists" });
        await _roleManager.CreateAsync(new IdentityRole(request.Name));
        return Ok(new { message = $"Role {request.Name} created" });
    }

    [HttpDelete("roles/{roleName}")]
    public async Task<IActionResult> DeleteRole(string roleName, CancellationToken ct)
    {
        if (roleName is "Admin" or "User")
            return BadRequest(new { error = "Cannot delete system roles" });
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role is null) return NotFound();
        await _roleManager.DeleteAsync(role);
        return Ok(new { message = $"Role {roleName} deleted" });
    }

    private static object GetRolePermissions(string role) => role switch
    {
        "Admin" => new
        {
            ManageUsers = true, ManageRoles = true, ManageSystem = true,
            ViewAllData = true, GenerateSignals = true, ManageAlerts = true,
            AccessOptionsFlow = true, ViewAnalytics = true, ManageApiKeys = true
        },
        "Moderator" => new
        {
            ManageUsers = false, ManageRoles = false, ManageSystem = false,
            ViewAllData = true, GenerateSignals = true, ManageAlerts = true,
            AccessOptionsFlow = true, ViewAnalytics = true, ManageApiKeys = false
        },
        "Analyst" => new
        {
            ManageUsers = false, ManageRoles = false, ManageSystem = false,
            ViewAllData = true, GenerateSignals = true, ManageAlerts = true,
            AccessOptionsFlow = true, ViewAnalytics = false, ManageApiKeys = false
        },
        _ => new
        {
            ManageUsers = false, ManageRoles = false, ManageSystem = false,
            ViewAllData = false, GenerateSignals = false, ManageAlerts = true,
            AccessOptionsFlow = false, ViewAnalytics = false, ManageApiKeys = false
        },
    };
}

public record RoleAssignRequest(string Role);
public record TierUpdateRequest(string Tier);
public record CreateRoleRequest(string Name);
