using System.Diagnostics.CodeAnalysis;
namespace NotificationService.Domain.Models;

[ExcludeFromCodeCoverage]

public class TaskNotification
{
    public string TaskId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AssignedTo { get; set; } = string.Empty;
    public string AssignedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "Pending";
}


