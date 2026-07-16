using LibrarySystem.Api.Models;

namespace LibrarySystem.Api.Services;

/// <summary>
/// Overdue fine calculation (Section 5.1.2):
/// Fine = whole overdue days × configurable daily rate (default 5 ETB/day).
/// </summary>
public static class FineCalculator
{
    public static decimal Calculate(DateTime dueDate, DateTime returnedOrNow, decimal ratePerDay)
    {
        if (returnedOrNow <= dueDate) return 0m;
        var overdueDays = (int)(returnedOrNow.Date - dueDate.Date).TotalDays;
        return overdueDays * ratePerDay;
    }
}
