namespace TaskService.Domain.Entities;

public class TaskComment
{
    public Guid Id { get; private set; }
    public Guid TaskId { get; private set; }
    public string UserId { get; private set; }
    public string UserName { get; private set; }
    public string UserRole { get; private set; } // "Parent" or "Child"
    public string Content { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public bool IsEdited => UpdatedAt.HasValue;
    
    // EF Core constructor
    private TaskComment()
    {
        UserId = null!;
        UserName = null!;
        UserRole = null!;
        Content = null!;
    }

    private TaskComment(Guid id, Guid taskId, string userId, string userName, string userRole, string content)
    {
        Id = id;
        TaskId = taskId;
        UserId = userId ?? throw new ArgumentNullException(nameof(userId));
        UserName = userName ?? throw new ArgumentNullException(nameof(userName));
        UserRole = userRole ?? throw new ArgumentNullException(nameof(userRole));
        Content = content ?? throw new ArgumentNullException(nameof(content));
        CreatedAt = DateTime.UtcNow;
    }

    public static TaskComment Create(Guid taskId, string userId, string userName, string userRole, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Comment content cannot be empty", nameof(content));
        }

        if (content.Length > 2000)
        {
            throw new ArgumentException("Comment content cannot exceed 2000 characters", nameof(content));
        }

        return new TaskComment(Guid.NewGuid(), taskId, userId, userName, userRole, content);
    }

    public void UpdateContent(string newContent)
    {
        if (string.IsNullOrWhiteSpace(newContent))
        {
            throw new ArgumentException("Comment content cannot be empty", nameof(newContent));
        }

        if (newContent.Length > 2000)
        {
            throw new ArgumentException("Comment content cannot exceed 2000 characters", nameof(newContent));
        }

        Content = newContent;
        UpdatedAt = DateTime.UtcNow;
    }
}
