using AuthService.Domain.Entities;

namespace UserService.Domain.Entities;

public class FamilyMessage
{
    public Guid Id { get; set; }
    public string FamilyId { get; set; } = string.Empty;
    public Guid SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public Guid? MentionedTaskId { get; set; }  // Reference to task, if mentioned
    public string? ReplyToMessageId { get; set; }  // For message replies
    
    // Navigation properties
    public User Sender { get; set; } = default!;
}
