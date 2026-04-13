using Microsoft.AspNetCore.Mvc;
using NotificationService.Application.Services;

namespace NotificationService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PresenceController(IConnectionManager connectionManager) : ControllerBase
{
    [HttpGet("online")]
    public async Task<IActionResult> GetOnlineStatuses([FromQuery] string[]? userIds)
    {
        var normalizedUserIds = (userIds ?? Array.Empty<string>())
            .Select(userId => userId?.Trim())
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Select(userId => userId!.ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .Take(100)
            .ToArray();

        if (normalizedUserIds.Length == 0)
        {
            return BadRequest(new { error = "At least one userId must be provided." });
        }

        var statuses = new Dictionary<string, bool>(normalizedUserIds.Length, StringComparer.Ordinal);

        foreach (var userId in normalizedUserIds)
        {
            var connections = await connectionManager.GetConnectionsAsync(userId!);
            statuses[userId!] = connections.Any();
        }

        return Ok(new { statuses });
    }
}