using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LibrarySystem.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace LibrarySystem.Api.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(User user);
}

public class TokenService(IConfiguration config) : ITokenService
{
    public (string Token, DateTime ExpiresAt) CreateToken(User user)
    {
        var key = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key))
        {
            key = "local-development-only-key-not-for-production-use-1234";
        }
        var expiryMinutes = int.TryParse(config["Jwt:ExpiryMinutes"], out var m) ? m : 60;
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
