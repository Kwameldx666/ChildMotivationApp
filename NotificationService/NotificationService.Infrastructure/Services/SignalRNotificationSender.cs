using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Services;

namespace NotificationService.Infrastructure.Services;

public class SignalRNotificationSender : INotificationSender
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IConnectionManager _connectionManager;
    private readonly ILogger<SignalRNotificationSender> _logger;

    public SignalRNotificationSender(
        IHubContext<NotificationHub> hubContext,
        IConnectionManager connectionManager,
        ILogger<SignalRNotificationSender> logger)
    {
        _hubContext = hubContext;
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public async Task SendToUserAsync<T>(string userId, string method, T data)
    {
        var connections = await _connectionManager.GetConnectionsAsync(userId);
        
        if (connections.Any())
        {
            await _hubContext.Clients.Clients(connections.ToList()).SendAsync(method, data);
            _logger.LogInformation("Notification sent to user {UserId} via method {Method}", userId, method);
        }
        else
        {
            _logger.LogWarning("No active connections found for user {UserId}", userId);
        }
    }
}

public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private readonly IConnectionManager _connectionManager;

    public NotificationHub(ILogger<NotificationHub> logger, IConnectionManager connectionManager)
    {
        _logger = logger;
        _connectionManager = connectionManager;
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var userId = httpContext?.Request.Query["userId"].ToString();
        var normalizedUserId = userId?.Trim();
        
        if (!string.IsNullOrWhiteSpace(normalizedUserId))
        {
            await _connectionManager.AddConnectionAsync(normalizedUserId, Context.ConnectionId);
            _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", normalizedUserId, Context.ConnectionId);
        }
        else
        {
            _logger.LogWarning("Connection {ConnectionId} attempted without userId", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _connectionManager.RemoveConnectionAsync(Context.ConnectionId);
        
        if (exception != null)
        {
            _logger.LogError(exception, "Connection {ConnectionId} disconnected with error", Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation("Connection {ConnectionId} disconnected", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToTaskNotifications(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"tasks_{userId}");
        _logger.LogInformation("Connection {ConnectionId} subscribed to task notifications for user {UserId}", 
            Context.ConnectionId, userId);
    }

    public async Task UnsubscribeFromTaskNotifications(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tasks_{userId}");
        _logger.LogInformation("Connection {ConnectionId} unsubscribed from task notifications for user {UserId}", 
            Context.ConnectionId, userId);
    }
}
