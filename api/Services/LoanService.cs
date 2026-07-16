using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Services;

public interface ILoanService
{
    Task<(LoanDto? Loan, string? Error)> CreateLoanAsync(Guid bookId, Guid userId);
    Task<(LoanDto? Loan, string? Error)> ReturnLoanAsync(Guid loanId, Guid actingUserId, bool isStaff);
    Task<(LoanDto? Loan, string? Error)> RenewLoanAsync(Guid loanId, Guid actingUserId, bool isStaff);
    Task<LoanDto?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<LoanDto>> GetForUserAsync(Guid userId);
    Task<IReadOnlyList<LoanDto>> GetOverdueAsync();
}

public class LoanService(LibraryDbContext context, IConfiguration config) : ILoanService
{
    private const int MaxActiveLoansPerMember = 5;   // Students may borrow up to 5 books (rule 3.5)
    private const int LoanPeriodDays = 14;           // ...for 14 days (rule 3.5)
    private const int ReservationPickupDays = 3;     // Reserved books collected within 3 days (rule 3.5)

    private decimal FineRatePerDay =>
        decimal.TryParse(config["Library:FineRatePerDay"], out var rate) ? rate : 5m;

    public async Task<(LoanDto? Loan, string? Error)> CreateLoanAsync(Guid bookId, Guid userId)
    {
        var book = await context.Books
            .Include(b => b.Author)
            .SingleOrDefaultAsync(b => b.Id == bookId);

        if (book is null || !book.IsAvailable())
            return (null, "Book is not available.");

        var activeLoans = await context.Loans
            .CountAsync(l => l.UserId == userId && l.Status == LoanStatus.Active);
        if (activeLoans >= MaxActiveLoansPerMember)
            return (null, $"Borrowing limit reached ({MaxActiveLoansPerMember} active loans).");

        var alreadyBorrowed = await context.Loans
            .AnyAsync(l => l.UserId == userId && l.BookId == bookId && l.Status == LoanStatus.Active);
        if (alreadyBorrowed)
            return (null, "You already have an active loan for this book.");

        var loan = new Loan
        {
            BookId = bookId,
            UserId = userId,
            BorrowDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(LoanPeriodDays),
            Status = LoanStatus.Active
        };

        book.CopiesAvailable -= 1;
        context.Loans.Add(loan);

        // If this member had a pending reservation for the book, mark it fulfilled.
        var reservation = await context.Reservations.FirstOrDefaultAsync(r =>
            r.BookId == bookId && r.UserId == userId && r.Status == ReservationStatus.Pending);
        if (reservation is not null)
            reservation.Status = ReservationStatus.Fulfilled;

        await context.SaveChangesAsync();
        return (await GetByIdAsync(loan.Id), null);
    }

    public async Task<(LoanDto? Loan, string? Error)> ReturnLoanAsync(Guid loanId, Guid actingUserId, bool isStaff)
    {
        var loan = await context.Loans
            .Include(l => l.Book)
            .Include(l => l.Fine)
            .SingleOrDefaultAsync(l => l.Id == loanId);

        if (loan is null)
            return (null, "Loan not found.");
        if (!isStaff && loan.UserId != actingUserId)
            return (null, "You can only return your own loans.");
        if (loan.Status == LoanStatus.Returned)
            return (null, "This loan has already been returned.");

        var now = DateTime.UtcNow;
        loan.ReturnDate = now;
        loan.Status = LoanStatus.Returned;

        // Overdue fine calculation (Section 5.1.2)
        var fineAmount = FineCalculator.Calculate(loan.DueDate, now, FineRatePerDay);
        if (fineAmount > 0 && loan.Fine is null)
        {
            context.Fines.Add(new Fine { LoanId = loan.Id, Amount = fineAmount, Paid = false });
        }

        if (loan.Book is not null)
        {
            loan.Book.CopiesAvailable += 1;

            // Notify next member in the reservation queue (Section 4.5.2)
            var nextReservation = await context.Reservations
                .Where(r => r.BookId == loan.BookId && r.Status == ReservationStatus.Pending)
                .OrderBy(r => r.ReservedAt)
                .FirstOrDefaultAsync();

            if (nextReservation is not null)
            {
                nextReservation.ExpiresAt = now.AddDays(ReservationPickupDays);
                context.Notifications.Add(new Notification
                {
                    UserId = nextReservation.UserId,
                    Type = NotificationType.ReservationAvailable,
                    Message = $"\"{loan.Book.Title}\" is now available. " +
                              $"Please collect it within {ReservationPickupDays} days."
                });
            }
        }

        await context.SaveChangesAsync();
        return (await GetByIdAsync(loan.Id), null);
    }

    public async Task<(LoanDto? Loan, string? Error)> RenewLoanAsync(Guid loanId, Guid actingUserId, bool isStaff)
    {
        var loan = await context.Loans.SingleOrDefaultAsync(l => l.Id == loanId);

        if (loan is null)
            return (null, "Loan not found.");
        if (!isStaff && loan.UserId != actingUserId)
            return (null, "You can only renew your own loans.");
        if (loan.Status != LoanStatus.Active)
            return (null, "Only active loans can be renewed.");
        if (loan.DueDate < DateTime.UtcNow)
            return (null, "Overdue loans cannot be renewed. Please return the book and settle the fine.");

        // A book with pending reservations cannot be renewed — the queue takes priority.
        var hasReservations = await context.Reservations.AnyAsync(r =>
            r.BookId == loan.BookId && r.Status == ReservationStatus.Pending);
        if (hasReservations)
            return (null, "This book is reserved by another member and cannot be renewed.");

        loan.DueDate = loan.DueDate.AddDays(LoanPeriodDays);
        await context.SaveChangesAsync();
        return (await GetByIdAsync(loan.Id), null);
    }

    public async Task<LoanDto?> GetByIdAsync(Guid id) =>
        await ProjectLoans(context.Loans.Where(l => l.Id == id)).SingleOrDefaultAsync();

    public async Task<IReadOnlyList<LoanDto>> GetForUserAsync(Guid userId) =>
        await ProjectLoans(context.Loans.Where(l => l.UserId == userId)
            .OrderByDescending(l => l.BorrowDate)).ToListAsync();

    public async Task<IReadOnlyList<LoanDto>> GetOverdueAsync() =>
        await ProjectLoans(context.Loans
            .Where(l => l.Status == LoanStatus.Active && l.DueDate < DateTime.UtcNow)
            .OrderBy(l => l.DueDate)).ToListAsync();

    private static IQueryable<LoanDto> ProjectLoans(IQueryable<Loan> query) =>
        query.Select(l => new LoanDto(
            l.Id, l.BookId, l.Book!.Title, l.UserId, l.User!.FullName,
            l.BorrowDate, l.DueDate, l.ReturnDate, l.Status.ToString(),
            l.Fine != null ? l.Fine.Amount : null,
            l.Fine != null ? l.Fine.Paid : null));
}
