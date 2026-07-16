using LibrarySystem.Api.Data;
using LibrarySystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Services;

/// <summary>
/// Background job (actor "System" in Section 3.4.1): flags overdue loans,
/// sends due-date / overdue notifications, and expires stale reservations.
/// Runs on a schedule inside the API process.
/// </summary>
public class OverdueBackgroundService(IServiceScopeFactory scopeFactory, ILogger<OverdueBackgroundService> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
                await ProcessAsync(context, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Overdue background job failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessAsync(LibraryDbContext context, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // 1. Flag active loans past their due date as Overdue and notify the member.
        var newlyOverdue = await context.Loans
            .Include(l => l.Book)
            .Where(l => l.Status == LoanStatus.Active && l.DueDate < now)
            .ToListAsync(ct);

        foreach (var loan in newlyOverdue)
        {
            loan.Status = LoanStatus.Overdue;
            context.Notifications.Add(new Notification
            {
                UserId = loan.UserId,
                Type = NotificationType.OverdueNotice,
                Message = $"\"{loan.Book?.Title}\" was due on {loan.DueDate:yyyy-MM-dd}. " +
                          "Please return it to avoid further fines."
            });
        }

        // 2. Due-date reminders for loans due within 2 days.
        var dueSoonWindow = now.AddDays(2);
        var dueSoon = await context.Loans
            .Include(l => l.Book)
            .Where(l => l.Status == LoanStatus.Active && l.DueDate >= now && l.DueDate <= dueSoonWindow)
            .ToListAsync(ct);

        foreach (var loan in dueSoon)
        {
            var alreadyNotified = await context.Notifications.AnyAsync(n =>
                n.UserId == loan.UserId &&
                n.Type == NotificationType.DueDateReminder &&
                n.Message.Contains(loan.Book!.Title) &&
                n.SentAt > now.AddDays(-3), ct);

            if (!alreadyNotified)
            {
                context.Notifications.Add(new Notification
                {
                    UserId = loan.UserId,
                    Type = NotificationType.DueDateReminder,
                    Message = $"Reminder: \"{loan.Book?.Title}\" is due on {loan.DueDate:yyyy-MM-dd}."
                });
            }
        }

        // 3. Expire reservations not collected within the pickup window (rule 3.5).
        var expired = await context.Reservations
            .Where(r => r.Status == ReservationStatus.Pending && r.ExpiresAt != null && r.ExpiresAt < now)
            .ToListAsync(ct);

        foreach (var reservation in expired)
            reservation.Status = ReservationStatus.Expired;

        var changes = await context.SaveChangesAsync(ct);
        if (changes > 0)
            logger.LogInformation(
                "Overdue job: {Overdue} flagged overdue, {DueSoon} reminders, {Expired} reservations expired.",
                newlyOverdue.Count, dueSoon.Count, expired.Count);
    }
}
