namespace SignalForge.Application.DTOs;

public record LoginDto(string Email, string Password);
public record RegisterDto(string Email, string Password, string FullName);
public record AuthResponseDto(string Token, string RefreshToken, DateTime Expiration, UserDto User);
public record UserDto(string Id, string Email, string FullName);
public record RefreshTokenDto(string Token, string RefreshToken);
