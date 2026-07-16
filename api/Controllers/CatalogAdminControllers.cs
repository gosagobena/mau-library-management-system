using LibrarySystem.Api.Data;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Controllers;

[ApiController]
[Route("api/authors")]
public class AuthorsController(LibraryDbContext context) : ControllerBase
{
    // GET /api/authors
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<AuthorDto>>> GetAll() =>
        Ok(await context.Authors
            .OrderBy(a => a.Name)
            .Select(a => new AuthorDto(a.Id, a.Name, a.Biography))
            .ToListAsync());

    // POST /api/authors
    [HttpPost]
    [Authorize(Roles = "Librarian,Administrator")]
    public async Task<ActionResult<AuthorDto>> Create([FromBody] CreateAuthorRequest request)
    {
        var author = new Author { Name = request.Name.Trim(), Biography = request.Biography };
        context.Authors.Add(author);
        await context.SaveChangesAsync();
        return Ok(new AuthorDto(author.Id, author.Name, author.Biography));
    }
}

[ApiController]
[Route("api/categories")]
public class CategoriesController(LibraryDbContext context) : ControllerBase
{
    // GET /api/categories
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll() =>
        Ok(await context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync());

    // POST /api/categories
    [HttpPost]
    [Authorize(Roles = "Librarian,Administrator")]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var category = new Category { Name = request.Name.Trim() };
        context.Categories.Add(category);
        await context.SaveChangesAsync();
        return Ok(new CategoryDto(category.Id, category.Name));
    }
}
