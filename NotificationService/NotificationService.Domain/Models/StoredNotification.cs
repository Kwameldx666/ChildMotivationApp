namespace NotificationService.Domain.Models;

/// <summary>
/// Сохранённое уведомление пользователя
/// </summary>
public class StoredNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = "general";
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object>? Data { get; set; }
}
