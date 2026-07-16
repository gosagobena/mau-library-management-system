namespace LibrarySystem.Api.Models;

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BookId { get; set; }
    public Book? Book { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTime ReservedAt { get; set; } = DateTime.UtcNow;
    /// <summary>Set when the book becomes available; member has 3 days to collect (business rule 3.5).</summary>
    public DateTime? ExpiresAt { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
}
