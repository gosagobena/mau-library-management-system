using LibrarySystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Data;

public class LibraryDbContext(DbContextOptions<LibraryDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Fine> Fines => Set<Fine>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Unique email per user (business rule 3.5)
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Book>()
            .HasIndex(b => b.ISBN);

        modelBuilder.Entity<Book>()
            .HasOne(b => b.Author)
            .WithMany(a => a.Books)
            .HasForeignKey(b => b.AuthorId);

        modelBuilder.Entity<Book>()
            .HasOne(b => b.Category)
            .WithMany(c => c.Books)
            .HasForeignKey(b => b.CategoryId);

        modelBuilder.Entity<Loan>()
            .HasOne(l => l.Book)
            .WithMany(b => b.Loans)
            .HasForeignKey(l => l.BookId);

        modelBuilder.Entity<Loan>()
            .HasOne(l => l.User)
            .WithMany(u => u.Loans)
            .HasForeignKey(l => l.UserId);

        modelBuilder.Entity<Fine>()
            .HasOne(f => f.Loan)
            .WithOne(l => l.Fine)
            .HasForeignKey<Fine>(f => f.LoanId);

        modelBuilder.Entity<Fine>()
            .Property(f => f.Amount)
            .HasPrecision(10, 2);

        // Store enums as readable strings
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<Loan>().Property(l => l.Status).HasConversion<string>();
        modelBuilder.Entity<Reservation>().Property(r => r.Status).HasConversion<string>();
        modelBuilder.Entity<Notification>().Property(n => n.Type).HasConversion<string>();
    }
}
