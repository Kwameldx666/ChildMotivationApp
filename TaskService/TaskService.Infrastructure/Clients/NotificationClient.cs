using TaskService.Application.Abstractions;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace TaskService.Infrastructure.Clients;

public class NotificationClient : INotificationClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NotificationClient> _logger;

    public NotificationClient(HttpClient httpClient, ILogger<NotificationClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task SendTaskCompletedNotificationAsync(
        string taskId,
        string title,
        string description,
        string[] userIds,
        CancellationToken cancellationToken = default)
    {
        foreach (var userId in userIds)
        {
            try
            {
                var payload = new
                {
                    userId,
                    taskId,
                    title,
                    description,
                    status = "Completed",
                    assignedTo = "",
                    assignedBy = ""
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync("/api/notifications/task/completed", content, cancellationToken);
                response.EnsureSuccessStatusCode();
                
                _logger.LogInformation("Sent task completed notification to user {UserId} for task {TaskId}", userId, taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send task completed notification to user {UserId} for task {TaskId}", userId, taskId);
            }
        }
    }

    public async Task SendTaskAssignedNotificationAsync(
        string taskId,
        string title,
        string description,
        string assignedTo,
        string assignedBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new
            {
                userId = assignedTo,
                taskId,
                title,
                description,
                assignedTo,
                assignedBy
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync("/api/notifications/task/assigned", content, cancellationToken);
            response.EnsureSuccessStatusCode();
            
            _logger.LogInformation("Sent task assigned notification to user {UserId} for task {TaskId}", assignedTo, taskId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send task assigned notification for task {TaskId}", taskId);
        }
    }

    public async Task SendNewCommentNotificationAsync(
        string taskId,
        string taskTitle,
        string commentAuthor,
        string[] userIds,
        CancellationToken cancellationToken = default)
    {
        foreach (var userId in userIds)
        {
            try
            {
                var payload = new
                {
                    userId,
                    title = "Новый комментарий",
                    message = $"{commentAuthor} оставил(а) комментарий к задаче \"{taskTitle}\"",
                    type = "comment",
                    data = new Dictionary<string, object>
                    {
                        ["taskId"] = taskId,
                        ["author"] = commentAuthor
                    }
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync("/api/notifications/general", content, cancellationToken);
                response.EnsureSuccessStatusCode();
                
                _logger.LogInformation("Sent comment notification to user {UserId} for task {TaskId}", userId, taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send comment notification to user {UserId} for task {TaskId}", userId, taskId);
            }
        }
    }
}
