using System.Diagnostics.CodeAnalysis;
namespace NotificationService.Domain.Models;

[ExcludeFromCodeCoverage]

public class GeneralNotification
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Message { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "Info"; // Info, Warning, Error, Success
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object>? Data { get; set; }
}


