namespace LibrarySystem.Api.Models;

public enum UserRole
{
    Member,
    Librarian,
    Administrator
}

public enum LoanStatus
{
    Active,
    Returned,
    Overdue
}

public enum ReservationStatus
{
    Pending,
    Fulfilled,
    Cancelled,
    Expired
}

public enum NotificationType
{
    DueDateReminder,
    OverdueNotice,
    ReservationAvailable
}
