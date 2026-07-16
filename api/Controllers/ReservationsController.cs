using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Extensions;
using LibrarySystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibrarySystem.Api.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController(IReservationService reservationService) : ControllerBase
{
    // POST /api/reservations — reserve a book
    [HttpPost]
    public async Task<ActionResult<ReservationDto>> Create([FromBody] CreateReservationRequest request)
    {
        var (reservation, error) = await reservationService.CreateAsync(request.BookId, User.GetUserId());
        return error is null ? Ok(reservation) : BadRequest(new { message = error });
    }

    // GET /api/reservations/mine
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<ReservationDto>>> GetMine() =>
        Ok(await reservationService.GetForUserAsync(User.GetUserId()));

    // DELETE /api/reservations/{id} — cancel
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ReservationDto>> Cancel(Guid id)
    {
        var (reservation, error) = await reservationService.CancelAsync(id, User.GetUserId(), User.IsStaff());
        return error is null ? Ok(reservation) : BadRequest(new { message = error });
    }
}
