namespace NotificationService.Application.Services;

public interface IConnectionManager
{
    Task AddConnectionAsync(string userId, string connectionId);
    Task RemoveConnectionAsync(string connectionId);
    Task<IEnumerable<string>> GetConnectionsAsync(string userId);
    Task<string?> GetUserIdAsync(string connectionId);
}
