using Gateway.Extensions;
using Gateway.Infrastructure.Services.Clients;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/family-chat")]
public class FamilyChatController : ControllerBase
{
    private readonly IFamilyChatClient _chatClient;

    public FamilyChatController(IFamilyChatClient chatClient)
    {
        _chatClient = chatClient;
    }

    [HttpGet("{familyId}")]
    public async Task<IActionResult> GetMessages(
        string familyId,
        [FromQuery] int limit = 50,
        [FromQuery] DateTime? before = null,
        CancellationToken cancellationToken = default)
    {
        using var response = await _chatClient.GetMessagesAsync(familyId, limit, before, cancellationToken);

        if (!response.IsSuccessStatusCode && IsChildUser(User))
        {
            return Ok(Array.Empty<object>());
        }

        return await response.ToActionResultAsync();
    }

    [HttpPost("{familyId}/messages")]
    public async Task<IActionResult> SendMessage(
        string familyId,
        [FromBody] object request,
        CancellationToken cancellationToken = default)
    {
        using var response = await _chatClient.SendMessageAsync(familyId, request, cancellationToken);

        if (!response.IsSuccessStatusCode && IsChildUser(User))
        {
            return Ok(new
            {
                id = Guid.NewGuid().ToString(),
                familyId,
                userId = User.GetUserId(),
                sentAt = DateTime.UtcNow,
                isMock = true
            });
        }

        return await response.ToActionResultAsync();
    }

    private static bool IsChildUser(ClaimsPrincipal user)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value
                   ?? user.FindFirst("role")?.Value;

        return string.Equals(role, "child", StringComparison.OrdinalIgnoreCase)
               || user.IsInRole("child");
    }
}