using LibrarySystem.Api.Services;

namespace LibrarySystem.Api.Tests;

/// <summary>Tests for the overdue fine algorithm in Section 5.1.2.</summary>
public class FineCalculatorTests
{
    private const decimal Rate = 5m; // 5 ETB/day

    [Fact]
    public void ReturnedOnTime_NoFine()
    {
        var due = new DateTime(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc);
        var returned = due; // exactly on time

        Assert.Equal(0m, FineCalculator.Calculate(due, returned, Rate));
    }

    [Fact]
    public void ReturnedEarly_NoFine()
    {
        var due = new DateTime(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc);
        var returned = due.AddDays(-3);

        Assert.Equal(0m, FineCalculator.Calculate(due, returned, Rate));
    }

    [Theory]
    [InlineData(1, 5)]
    [InlineData(3, 15)]
    [InlineData(14, 70)]
    public void ReturnedLate_ChargesPerWholeDay(int daysLate, decimal expected)
    {
        var due = new DateTime(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc);
        var returned = due.AddDays(daysLate);

        Assert.Equal(expected, FineCalculator.Calculate(due, returned, Rate));
    }

    [Fact]
    public void FineUsesWholeDays_SameDayLateHoursIgnored()
    {
        var due = new DateTime(2026, 7, 10, 9, 0, 0, DateTimeKind.Utc);
        var returned = new DateTime(2026, 7, 10, 21, 0, 0, DateTimeKind.Utc); // late by hours, same date

        Assert.Equal(0m, FineCalculator.Calculate(due, returned, Rate));
    }

    [Fact]
    public void CustomRate_IsRespected()
    {
        var due = new DateTime(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc);
        var returned = due.AddDays(2);

        Assert.Equal(20m, FineCalculator.Calculate(due, returned, 10m));
    }
}
