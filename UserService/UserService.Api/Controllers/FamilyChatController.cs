using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Dto.FamilyChat;
using UserService.Application.Features.FamilyChat.Commands.SendMessage;
using UserService.Application.Features.FamilyChat.Queries.GetMessages;

namespace UserService.Api.Controllers;

[ApiController]
[Authorize]
[Route("user-service/family-chat")]
public class FamilyChatController : ControllerBase
{
    private readonly IMediator _mediator;

    public FamilyChatController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{familyId}")]
    public async Task<ActionResult<List<FamilyMessageDto>>> GetMessages(
        string familyId,
        [FromQuery] int limit = 50,
        [FromQuery] DateTime? before = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetFamilyMessagesQuery(familyId, limit, before);
        var messages = await _mediator.Send(query, cancellationToken);
        return Ok(messages);
    }

    [HttpPost("{familyId}/messages")]
    public async Task<ActionResult<FamilyMessageDto>> SendMessage(
        string familyId,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst("sub")?.Value 
                     ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found in token");
        }

        var command = new SendFamilyMessageCommand(
            familyId,
            userId,
            request.Content,
            request.MentionedTaskId,
            request.ReplyToMessageId
        );

        var message = await _mediator.Send(command, cancellationToken);
        return Ok(message);
    }
}
