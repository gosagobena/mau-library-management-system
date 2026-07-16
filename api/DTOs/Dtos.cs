using System.ComponentModel.DataAnnotations;
using LibrarySystem.Api.Models;

namespace LibrarySystem.Api.DTOs;

// ── Auth ─────────────────────────────────────────────────

public record RegisterRequest(
    [Required, MaxLength(120)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);

// ── Users ────────────────────────────────────────────────

public record UserDto(Guid Id, string FullName, string Email, string Role, bool IsActive);

public record UpdateUserRoleRequest([Required] UserRole Role);

public record UpdateUserStatusRequest(bool IsActive);

// ── Books ────────────────────────────────────────────────

public record BookDto(
    Guid Id, string Title, string ISBN,
    Guid AuthorId, string AuthorName,
    Guid CategoryId, string CategoryName,
    int CopiesTotal, int CopiesAvailable, bool OutOfCirculation);

public record CreateBookRequest(
    [Required, MaxLength(300)] string Title,
    [Required, MaxLength(20)] string ISBN,
    [Required] Guid AuthorId,
    [Required] Guid CategoryId,
    [Range(1, 10_000)] int CopiesTotal);

public record UpdateBookRequest(
    [Required, MaxLength(300)] string Title,
    [Required, MaxLength(20)] string ISBN,
    [Required] Guid AuthorId,
    [Required] Guid CategoryId,
    [Range(0, 10_000)] int CopiesTotal,
    [Range(0, 10_000)] int CopiesAvailable,
    bool OutOfCirculation);

public record AuthorDto(Guid Id, string Name, string? Biography);
public record CreateAuthorRequest([Required, MaxLength(200)] string Name, string? Biography);
public record CategoryDto(Guid Id, string Name);
public record CreateCategoryRequest([Required, MaxLength(100)] string Name);

// ── Loans ────────────────────────────────────────────────

public record CreateLoanRequest([Required] Guid BookId);

public record LoanDto(
    Guid Id, Guid BookId, string BookTitle, Guid UserId, string MemberName,
    DateTime BorrowDate, DateTime DueDate, DateTime? ReturnDate,
    string Status, decimal? FineAmount, bool? FinePaid);

// ── Reservations ─────────────────────────────────────────

public record CreateReservationRequest([Required] Guid BookId);

public record ReservationDto(
    Guid Id, Guid BookId, string BookTitle, Guid UserId,
    DateTime ReservedAt, DateTime? ExpiresAt, string Status);

// ── Notifications ────────────────────────────────────────

public record NotificationDto(Guid Id, string Message, string Type, DateTime SentAt, bool Read);

// ── Shared ───────────────────────────────────────────────

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
