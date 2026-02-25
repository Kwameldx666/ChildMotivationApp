using MediatR;
using Microsoft.AspNetCore.Mvc;
using TaskService.Application.Features.Comments.Commands.CreateComment;
using TaskService.Application.Features.Comments.Queries.GetCommentsByTaskId;

namespace TaskService.Api.Controllers;

[ApiController]
[Route("task-service/tasks/{taskId:guid}/comments")]
public class CommentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid taskId, CancellationToken cancellationToken)
    {
        var comments = await _mediator.Send(new GetCommentsByTaskIdQuery(taskId), cancellationToken);
        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> CreateComment(Guid taskId, [FromBody] CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateCommentCommand(
            taskId,
            request.UserId,
            request.UserName,
            request.UserRole,
            request.Content
        );

        var comment = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetComments), new { taskId }, comment);
    }
}

public record CreateCommentRequest(
    string UserId,
    string UserName,
    string UserRole,
    string Content
);
