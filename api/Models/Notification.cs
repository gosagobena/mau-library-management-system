namespace LibrarySystem.Api.Models;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool Read { get; set; }
}
