using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Services;

public interface IReservationService
{
    Task<(ReservationDto? Reservation, string? Error)> CreateAsync(Guid bookId, Guid userId);
    Task<(ReservationDto? Reservation, string? Error)> CancelAsync(Guid reservationId, Guid actingUserId, bool isStaff);
    Task<IReadOnlyList<ReservationDto>> GetForUserAsync(Guid userId);
}

public class ReservationService(LibraryDbContext context) : IReservationService
{
    public async Task<(ReservationDto? Reservation, string? Error)> CreateAsync(Guid bookId, Guid userId)
    {
        var book = await context.Books.FindAsync(bookId);
        if (book is null || book.OutOfCirculation)
            return (null, "Book not found or out of circulation.");

        // Reservations only make sense when no copy is immediately available (rule 3.5).
        if (book.CopiesAvailable > 0)
            return (null, "This book is currently available — you can borrow it directly.");

        var existing = await context.Reservations.AnyAsync(r =>
            r.BookId == bookId && r.UserId == userId && r.Status == ReservationStatus.Pending);
        if (existing)
            return (null, "You already have a pending reservation for this book.");

        var reservation = new Reservation { BookId = bookId, UserId = userId };
        context.Reservations.Add(reservation);
        await context.SaveChangesAsync();

        return (await ProjectAsync(reservation.Id), null);
    }

    public async Task<(ReservationDto? Reservation, string? Error)> CancelAsync(
        Guid reservationId, Guid actingUserId, bool isStaff)
    {
        var reservation = await context.Reservations.FindAsync(reservationId);
        if (reservation is null)
            return (null, "Reservation not found.");
        if (!isStaff && reservation.UserId != actingUserId)
            return (null, "You can only cancel your own reservations.");
        if (reservation.Status != ReservationStatus.Pending)
            return (null, "Only pending reservations can be cancelled.");

        reservation.Status = ReservationStatus.Cancelled;
        await context.SaveChangesAsync();
        return (await ProjectAsync(reservation.Id), null);
    }

    public async Task<IReadOnlyList<ReservationDto>> GetForUserAsync(Guid userId) =>
        await context.Reservations
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ReservedAt)
            .Select(r => new ReservationDto(
                r.Id, r.BookId, r.Book!.Title, r.UserId, r.ReservedAt, r.ExpiresAt, r.Status.ToString()))
            .ToListAsync();

    private async Task<ReservationDto?> ProjectAsync(Guid id) =>
        await context.Reservations
            .Where(r => r.Id == id)
            .Select(r => new ReservationDto(
                r.Id, r.BookId, r.Book!.Title, r.UserId, r.ReservedAt, r.ExpiresAt, r.Status.ToString()))
            .SingleOrDefaultAsync();
}
