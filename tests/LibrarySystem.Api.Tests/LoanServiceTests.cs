using LibrarySystem.Api.Data;
using LibrarySystem.Api.Models;
using LibrarySystem.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LibrarySystem.Api.Tests;

/// <summary>
/// LoanService unit tests against the EF Core in-memory provider —
/// covers the borrowing business rules from Section 3.5.
/// </summary>
public class LoanServiceTests
{
    private static LibraryDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<LibraryDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Library:FineRatePerDay"] = "5"
            })
            .Build();

    private static async Task<(Book Book, User User)> SeedAsync(LibraryDbContext context, int copies = 2)
    {
        var author = new Author { Name = "Test Author" };
        var category = new Category { Name = "Test Category" };
        var book = new Book
        {
            Title = "Clean Architecture",
            ISBN = "978-0134494166",
            AuthorId = author.Id,
            Author = author,
            CategoryId = category.Id,
            Category = category,
            CopiesTotal = copies,
            CopiesAvailable = copies
        };
        var user = new User
        {
            FullName = "Test Member",
            Email = "member@mau.edu.et",
            PasswordHash = "hash"
        };

        context.AddRange(author, category, book, user);
        await context.SaveChangesAsync();
        return (book, user);
    }

    [Fact]
    public async Task Borrow_AvailableBook_CreatesActiveLoanAndDecrementsCopies()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context);
        var service = new LoanService(context, CreateConfig());

        var (loan, error) = await service.CreateLoanAsync(book.Id, user.Id);

        Assert.Null(error);
        Assert.NotNull(loan);
        Assert.Equal("Active", loan!.Status);
        Assert.Equal(1, (await context.Books.FindAsync(book.Id))!.CopiesAvailable);
        // 14-day loan period (rule 3.5)
        Assert.Equal(14, (loan.DueDate - loan.BorrowDate).Days);
    }

    [Fact]
    public async Task Borrow_NoCopiesAvailable_Fails()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context, copies: 0);
        book.CopiesAvailable = 0;
        await context.SaveChangesAsync();
        var service = new LoanService(context, CreateConfig());

        var (loan, error) = await service.CreateLoanAsync(book.Id, user.Id);

        Assert.Null(loan);
        Assert.Equal("Book is not available.", error);
    }

    [Fact]
    public async Task Borrow_BeyondFiveActiveLoans_Fails()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context, copies: 10);
        var service = new LoanService(context, CreateConfig());

        // Simulate 5 existing active loans (limit per rule 3.5)
        for (var i = 0; i < 5; i++)
        {
            context.Loans.Add(new Loan
            {
                BookId = book.Id,
                UserId = user.Id,
                BorrowDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(14),
                Status = LoanStatus.Active
            });
        }
        await context.SaveChangesAsync();

        var (loan, error) = await service.CreateLoanAsync(book.Id, user.Id);

        Assert.Null(loan);
        Assert.Contains("Borrowing limit", error);
    }

    [Fact]
    public async Task Return_LateLoan_CreatesUnpaidFine()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context);
        var service = new LoanService(context, CreateConfig());

        var loan = new Loan
        {
            BookId = book.Id,
            UserId = user.Id,
            BorrowDate = DateTime.UtcNow.AddDays(-20),
            DueDate = DateTime.UtcNow.AddDays(-6), // 6 days overdue
            Status = LoanStatus.Active
        };
        book.CopiesAvailable -= 1;
        context.Loans.Add(loan);
        await context.SaveChangesAsync();

        var (returned, error) = await service.ReturnLoanAsync(loan.Id, user.Id, isStaff: false);

        Assert.Null(error);
        Assert.Equal("Returned", returned!.Status);
        var fine = await context.Fines.SingleAsync(f => f.LoanId == loan.Id);
        Assert.Equal(30m, fine.Amount); // 6 days × 5 ETB
        Assert.False(fine.Paid);
        Assert.Equal(2, (await context.Books.FindAsync(book.Id))!.CopiesAvailable);
    }

    [Fact]
    public async Task Return_OnTime_NoFineAndNotifiesNextReservation()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context, copies: 1);
        var service = new LoanService(context, CreateConfig());

        var waitingMember = new User
        {
            FullName = "Waiting Member",
            Email = "waiting@mau.edu.et",
            PasswordHash = "hash"
        };
        context.Users.Add(waitingMember);

        var loan = new Loan
        {
            BookId = book.Id,
            UserId = user.Id,
            BorrowDate = DateTime.UtcNow.AddDays(-2),
            DueDate = DateTime.UtcNow.AddDays(12),
            Status = LoanStatus.Active
        };
        book.CopiesAvailable = 0;
        context.Loans.Add(loan);
        context.Reservations.Add(new Reservation
        {
            BookId = book.Id,
            UserId = waitingMember.Id,
            Status = ReservationStatus.Pending
        });
        await context.SaveChangesAsync();

        var (_, error) = await service.ReturnLoanAsync(loan.Id, user.Id, isStaff: false);

        Assert.Null(error);
        Assert.False(await context.Fines.AnyAsync());
        // Next member in queue is notified (Section 4.5.2)
        var notification = await context.Notifications.SingleAsync();
        Assert.Equal(waitingMember.Id, notification.UserId);
        Assert.Equal(NotificationType.ReservationAvailable, notification.Type);
        var reservation = await context.Reservations.SingleAsync();
        Assert.NotNull(reservation.ExpiresAt); // 3-day pickup window set
    }

    [Fact]
    public async Task Return_SomeoneElsesLoan_AsMember_Fails()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context);
        var service = new LoanService(context, CreateConfig());

        var otherUser = new User
        {
            FullName = "Other",
            Email = "other@mau.edu.et",
            PasswordHash = "hash"
        };
        context.Users.Add(otherUser);

        var loan = new Loan
        {
            BookId = book.Id,
            UserId = user.Id,
            BorrowDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(14),
            Status = LoanStatus.Active
        };
        context.Loans.Add(loan);
        await context.SaveChangesAsync();

        var (returned, error) = await service.ReturnLoanAsync(loan.Id, otherUser.Id, isStaff: false);

        Assert.Null(returned);
        Assert.Equal("You can only return your own loans.", error);
    }

    [Fact]
    public async Task Renew_WithPendingReservation_Fails()
    {
        await using var context = CreateContext();
        var (book, user) = await SeedAsync(context);
        var service = new LoanService(context, CreateConfig());

        var loan = new Loan
        {
            BookId = book.Id,
            UserId = user.Id,
            BorrowDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(7),
            Status = LoanStatus.Active
        };
        context.Loans.Add(loan);
        context.Reservations.Add(new Reservation
        {
            BookId = book.Id,
            UserId = user.Id,
            Status = ReservationStatus.Pending
        });
        await context.SaveChangesAsync();

        var (renewed, error) = await service.RenewLoanAsync(loan.Id, user.Id, isStaff: false);

        Assert.Null(renewed);
        Assert.Contains("reserved", error);
    }
}
