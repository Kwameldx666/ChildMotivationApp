using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gateway.Infrastructure.Services.Clients;

namespace Gateway.Api.Features.Controllers;

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
        return await response.ToActionResultAsync();
    }

    [HttpPost("{familyId}/messages")]
    public async Task<IActionResult> SendMessage(
        string familyId,
        [FromBody] object request,
        CancellationToken cancellationToken = default)
    {
        using var response = await _chatClient.SendMessageAsync(familyId, request, cancellationToken);
        return await response.ToActionResultAsync();
    }
}
