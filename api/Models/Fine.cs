namespace LibrarySystem.Api.Models;

public class Fine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LoanId { get; set; }
    public Loan? Loan { get; set; }
    public decimal Amount { get; set; }
    public bool Paid { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
