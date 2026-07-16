using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(LibraryDbContext context) : ControllerBase
{
    // GET /api/notifications/mine
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetMine() =>
        Ok(await context.Notifications
            .Where(n => n.UserId == User.GetUserId())
            .OrderByDescending(n => n.SentAt)
            .Take(50)
            .Select(n => new NotificationDto(n.Id, n.Message, n.Type.ToString(), n.SentAt, n.Read))
            .ToListAsync());

    // PUT /api/notifications/{id}/read
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var notification = await context.Notifications
            .SingleOrDefaultAsync(n => n.Id == id && n.UserId == User.GetUserId());
        if (notification is null) return NotFound();

        notification.Read = true;
        await context.SaveChangesAsync();
        return NoContent();
    }
}
