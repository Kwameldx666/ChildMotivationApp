using System.Collections.Concurrent;

namespace NotificationService.Application.Services;

public class ConnectionManager : IConnectionManager
{
    private readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();
    private readonly ConcurrentDictionary<string, string> _connectionToUser = new();

    public Task AddConnectionAsync(string userId, string connectionId)
    {
        _userConnections.AddOrUpdate(
            userId,
            _ => new HashSet<string> { connectionId },
            (_, connections) =>
            {
                lock (connections)
                {
                    connections.Add(connectionId);
                }
                return connections;
            });

        _connectionToUser[connectionId] = userId;
        
        return Task.CompletedTask;
    }

    public Task RemoveConnectionAsync(string connectionId)
    {
        if (_connectionToUser.TryRemove(connectionId, out var userId))
        {
            if (_userConnections.TryGetValue(userId, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(connectionId);
                    
                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(userId, out _);
                    }
                }
            }
        }
        
        return Task.CompletedTask;
    }

    public Task<IEnumerable<string>> GetConnectionsAsync(string userId)
    {
        if (_userConnections.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                return Task.FromResult<IEnumerable<string>>(connections.ToList());
            }
        }
        
        return Task.FromResult<IEnumerable<string>>(Array.Empty<string>());
    }

    public Task<string?> GetUserIdAsync(string connectionId)
    {
        _connectionToUser.TryGetValue(connectionId, out var userId);
        return Task.FromResult(userId);
    }
}
