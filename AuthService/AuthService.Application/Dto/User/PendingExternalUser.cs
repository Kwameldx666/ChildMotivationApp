namespace AuthService.Application.Dto.User;

public class PendingExternalUser
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Picture { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
}