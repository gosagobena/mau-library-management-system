using LibrarySystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Data;

/// <summary>Seeds default admin account and starter catalog data on first run.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(LibraryDbContext context, IConfiguration config)
    {
        await context.Database.MigrateAsync();

        if (!await context.Users.AnyAsync(u => u.Role == UserRole.Administrator))
        {
            var adminEmail = config["Seed:AdminEmail"] ?? "admin@mau.edu.et";
            var adminPassword = config["Seed:AdminPassword"] ?? "ChangeMe123!";
            context.Users.Add(new User
            {
                FullName = "System Administrator",
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = UserRole.Administrator
            });
        }

        if (!await context.Categories.AnyAsync())
        {
            var categories = new[] { "Engineering", "Natural Sciences", "Medicine", "Business", "Education", "General" }
                .Select(name => new Category { Name = name })
                .ToList();
            context.Categories.AddRange(categories);
        }

        await context.SaveChangesAsync();
    }
}
