using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Services;

public interface IAuthService
{
    Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request);
    Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request);
}

public class AuthService(LibraryDbContext context, ITokenService tokenService) : IAuthService
{
    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await context.Users.AnyAsync(u => u.Email == email))
            return (null, "An account with this email already exists.");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Member
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return (BuildResponse(user), null);
    }

    public async Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await context.Users.SingleOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (null, "Invalid email or password.");

        if (!user.IsActive)
            return (null, "This account has been suspended. Contact the library desk.");

        return (BuildResponse(user), null);
    }

    private AuthResponse BuildResponse(User user)
    {
        var (token, expiresAt) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAt,
            new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(), user.IsActive));
    }
}
