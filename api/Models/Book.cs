namespace LibrarySystem.Api.Models;

public class Book
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public Author? Author { get; set; }
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
    public int CopiesTotal { get; set; }
    public int CopiesAvailable { get; set; }
    /// <summary>Damaged/missing books are taken out of circulation (business rule 3.5).</summary>
    public bool OutOfCirculation { get; set; }

    public ICollection<Loan> Loans { get; set; } = new List<Loan>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();

    public bool IsAvailable() => !OutOfCirculation && CopiesAvailable > 0;
}
