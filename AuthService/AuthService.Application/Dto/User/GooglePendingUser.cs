namespace AuthService.Application.Dto.User;

public class GooglePendingUser
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required string Picture { get; init; }
    public required string Subject { get; init; }
}