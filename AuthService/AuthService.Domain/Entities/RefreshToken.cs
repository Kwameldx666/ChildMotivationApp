namespace AuthService.Domain.Entities;

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Token { get; set; }
    public DateTime ExpiresOnUtc { get; set; }
    public User User { get; set; } = null!;
}