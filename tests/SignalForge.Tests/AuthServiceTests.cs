using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using SignalForge.Application.DTOs;
using SignalForge.Infrastructure.Identity;

namespace SignalForge.Tests;

public class AuthServiceTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly IConfiguration _config;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSuperSecretKey256BitsLongEnoughForHS256!!",
                ["Jwt:Issuer"] = "signalforge-test",
            })
            .Build();

        _authService = new AuthService(_userManagerMock.Object, _config, Mock.Of<ILogger<AuthService>>());
    }

    [Fact]
    public async Task LoginAsync_InvalidCredentials_ThrowsUnauthorized()
    {
        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _authService.LoginAsync(new LoginDto("bad@email.com", "wrong"), CancellationToken.None));
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokens()
    {
        var user = new ApplicationUser
        {
            Id = "user-1",
            UserName = "test@test.com",
            Email = "test@test.com",
            FullName = "Test User",
            Tier = "pro"
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync("test@test.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "Password123!")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>())).ReturnsAsync(IdentityResult.Success);

        var result = await _authService.LoginAsync(new LoginDto("test@test.com", "Password123!"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.NotEmpty(result.RefreshToken);
        Assert.Equal("test@test.com", result.User.Email);
    }

    [Fact]
    public async Task RegisterAsync_Failure_ThrowsException()
    {
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Email taken" }));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _authService.RegisterAsync(new RegisterDto("test@test.com", "pass", "Test"), CancellationToken.None));
    }

    [Fact]
    public async Task GetCurrentUserAsync_ExistingUser_ReturnsDto()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@test.com", FullName = "Test User" };
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);

        var result = await _authService.GetCurrentUserAsync("user-1", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("test@test.com", result!.Email);
    }
}
