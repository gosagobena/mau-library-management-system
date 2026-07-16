using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Controllers;

/// <summary>User account and role management — administrators only (Section 3.7 RBAC).</summary>
[ApiController]
[Route("api/users")]
[Authorize(Roles = "Administrator")]
public class UsersController(LibraryDbContext context) : ControllerBase
{
    // GET /api/users
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll() =>
        Ok(await context.Users
            .OrderBy(u => u.FullName)
            .Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Role.ToString(), u.IsActive))
            .ToListAsync());

    // PUT /api/users/{id}/role
    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await context.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.Role = request.Role;
        await context.SaveChangesAsync();
        return Ok(new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(), user.IsActive));
    }

    // PUT /api/users/{id}/status — approve, suspend, or deactivate accounts (rule 3.5)
    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<UserDto>> UpdateStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await context.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.IsActive = request.IsActive;
        await context.SaveChangesAsync();
        return Ok(new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(), user.IsActive));
    }
}
