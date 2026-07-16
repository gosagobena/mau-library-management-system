using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Extensions;
using LibrarySystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibrarySystem.Api.Controllers;

[ApiController]
[Route("api/loans")]
[Authorize]
public class LoansController(ILoanService loanService) : ControllerBase
{
    // POST /api/loans — borrow a book
    [HttpPost]
    public async Task<ActionResult<LoanDto>> BorrowBook([FromBody] CreateLoanRequest request)
    {
        var (loan, error) = await loanService.CreateLoanAsync(request.BookId, User.GetUserId());
        if (error is not null)
            return BadRequest(new { message = error });

        return CreatedAtAction(nameof(GetLoan), new { id = loan!.Id }, loan);
    }

    // GET /api/loans/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LoanDto>> GetLoan(Guid id)
    {
        var loan = await loanService.GetByIdAsync(id);
        if (loan is null) return NotFound();
        if (!User.IsStaff() && loan.UserId != User.GetUserId()) return Forbid();
        return Ok(loan);
    }

    // GET /api/loans/mine — the member's own borrowing history
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<LoanDto>>> GetMyLoans() =>
        Ok(await loanService.GetForUserAsync(User.GetUserId()));

    // PUT /api/loans/{id}/return
    [HttpPut("{id:guid}/return")]
    public async Task<ActionResult<LoanDto>> ReturnBook(Guid id)
    {
        var (loan, error) = await loanService.ReturnLoanAsync(id, User.GetUserId(), User.IsStaff());
        return error is null ? Ok(loan) : BadRequest(new { message = error });
    }

    // PUT /api/loans/{id}/renew
    [HttpPut("{id:guid}/renew")]
    public async Task<ActionResult<LoanDto>> RenewLoan(Guid id)
    {
        var (loan, error) = await loanService.RenewLoanAsync(id, User.GetUserId(), User.IsStaff());
        return error is null ? Ok(loan) : BadRequest(new { message = error });
    }
}
