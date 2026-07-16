namespace LibrarySystem.Api.Models;

public class Loan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BookId { get; set; }
    public Book? Book { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Active;

    public Fine? Fine { get; set; }
}
