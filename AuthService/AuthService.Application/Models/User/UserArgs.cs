namespace AuthService.Application.Models.User;

public class UserArgs
{
    public required string UserId { get; set; }
    public required string Email { get; set; }
    public required IEnumerable<string> Roles { get; set; }
    public IEnumerable<string> Scopes { get; set; } = [];
}