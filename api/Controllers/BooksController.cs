using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController(LibraryDbContext context) : ControllerBase
{
    // GET /api/books?search=&categoryId=&page=&pageSize=
    // Public catalog search — guests get read-only access (Section 3.7 RBAC).
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<BookDto>>> Search(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = context.Books
            .Include(b => b.Author)
            .Include(b => b.Category)
            .Where(b => !b.OutOfCirculation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(b =>
                EF.Functions.ILike(b.Title, term) ||
                EF.Functions.ILike(b.ISBN, term) ||
                EF.Functions.ILike(b.Author!.Name, term));
        }

        if (categoryId is not null)
            query = query.Where(b => b.CategoryId == categoryId);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(b => b.Title)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => ToDto(b))
            .ToListAsync();

        return Ok(new PagedResult<BookDto>(items, total, page, pageSize));
    }

    // GET /api/books/{id}
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<BookDto>> GetById(Guid id)
    {
        var book = await context.Books
            .Include(b => b.Author)
            .Include(b => b.Category)
            .SingleOrDefaultAsync(b => b.Id == id);

        return book is null ? NotFound() : Ok(ToDto(book));
    }

    // POST /api/books — inventory CRUD is staff-only (rule 3.5)
    [HttpPost]
    [Authorize(Roles = "Librarian,Administrator")]
    public async Task<ActionResult<BookDto>> Create([FromBody] CreateBookRequest request)
    {
        if (!await context.Authors.AnyAsync(a => a.Id == request.AuthorId))
            return BadRequest(new { message = "Unknown author." });
        if (!await context.Categories.AnyAsync(c => c.Id == request.CategoryId))
            return BadRequest(new { message = "Unknown category." });

        var book = new Book
        {
            Title = request.Title.Trim(),
            ISBN = request.ISBN.Trim(),
            AuthorId = request.AuthorId,
            CategoryId = request.CategoryId,
            CopiesTotal = request.CopiesTotal,
            CopiesAvailable = request.CopiesTotal
        };

        context.Books.Add(book);
        await context.SaveChangesAsync();
        await context.Entry(book).Reference(b => b.Author).LoadAsync();
        await context.Entry(book).Reference(b => b.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = book.Id }, ToDto(book));
    }

    // PUT /api/books/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Librarian,Administrator")]
    public async Task<ActionResult<BookDto>> Update(Guid id, [FromBody] UpdateBookRequest request)
    {
        var book = await context.Books
            .Include(b => b.Author)
            .Include(b => b.Category)
            .SingleOrDefaultAsync(b => b.Id == id);
        if (book is null) return NotFound();

        book.Title = request.Title.Trim();
        book.ISBN = request.ISBN.Trim();
        book.AuthorId = request.AuthorId;
        book.CategoryId = request.CategoryId;
        book.CopiesTotal = request.CopiesTotal;
        book.CopiesAvailable = request.CopiesAvailable;
        book.OutOfCirculation = request.OutOfCirculation;

        await context.SaveChangesAsync();
        return Ok(ToDto(book));
    }

    // DELETE /api/books/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Librarian,Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var book = await context.Books.FindAsync(id);
        if (book is null) return NotFound();

        var hasActiveLoans = await context.Loans
            .AnyAsync(l => l.BookId == id && l.Status != LoanStatus.Returned);
        if (hasActiveLoans)
            return Conflict(new { message = "Cannot delete a book with active loans. Mark it out of circulation instead." });

        context.Books.Remove(book);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static BookDto ToDto(Book b) => new(
        b.Id, b.Title, b.ISBN,
        b.AuthorId, b.Author?.Name ?? string.Empty,
        b.CategoryId, b.Category?.Name ?? string.Empty,
        b.CopiesTotal, b.CopiesAvailable, b.OutOfCirculation);
}
