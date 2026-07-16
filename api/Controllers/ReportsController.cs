using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Models;
using LibrarySystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Controllers;

/// <summary>Basic reporting: overdue books, borrowing trends, inventory status (Section 1.5).</summary>
[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Librarian,Administrator")]
public class ReportsController(LibraryDbContext context, ILoanService loanService) : ControllerBase
{
    // GET /api/reports/overdue
    [HttpGet("overdue")]
    public async Task<ActionResult<IReadOnlyList<LoanDto>>> GetOverdue() =>
        Ok(await loanService.GetOverdueAsync());

    // GET /api/reports/inventory
    [HttpGet("inventory")]
    public async Task<ActionResult<object>> GetInventory()
    {
        var totalTitles = await context.Books.CountAsync();
        var totalCopies = await context.Books.SumAsync(b => b.CopiesTotal);
        var availableCopies = await context.Books.SumAsync(b => b.CopiesAvailable);
        var outOfCirculation = await context.Books.CountAsync(b => b.OutOfCirculation);
        var activeLoans = await context.Loans.CountAsync(l => l.Status == LoanStatus.Active);
        var overdueLoans = await context.Loans.CountAsync(l =>
            l.Status == LoanStatus.Overdue ||
            (l.Status == LoanStatus.Active && l.DueDate < DateTime.UtcNow));
        var pendingReservations = await context.Reservations
            .CountAsync(r => r.Status == ReservationStatus.Pending);
        var unpaidFines = await context.Fines.Where(f => !f.Paid).SumAsync(f => (decimal?)f.Amount) ?? 0m;

        return Ok(new
        {
            totalTitles,
            totalCopies,
            availableCopies,
            outOfCirculation,
            activeLoans,
            overdueLoans,
            pendingReservations,
            unpaidFines
        });
    }

    // GET /api/reports/trends?days=30 — borrowing volume per day
    [HttpGet("trends")]
    public async Task<ActionResult<object>> GetTrends([FromQuery] int days = 30)
    {
        days = Math.Clamp(days, 1, 365);
        var since = DateTime.UtcNow.Date.AddDays(-days);

        var trend = await context.Loans
            .Where(l => l.BorrowDate >= since)
            .GroupBy(l => l.BorrowDate.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return Ok(trend);
    }
}
