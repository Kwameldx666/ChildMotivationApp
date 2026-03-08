using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskService.Api.Contracts.Tasks;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Features.Tasks.Commands.CompleteTask;
using TaskService.Application.Features.Tasks.Commands.RequestApproval;
using TaskService.Application.Features.Tasks.Commands.ApproveTask;
using TaskService.Application.Features.Tasks.Commands.RejectApproval;
using TaskService.Application.Features.Tasks.Commands.CreateTask;
using TaskService.Application.Features.Tasks.Commands.DeleteTask;
using TaskService.Application.Features.Tasks.Commands.SubmitTaskEvidence;
using TaskService.Application.Features.Tasks.Commands.UpdateTask;
using TaskService.Application.Features.Tasks.Queries.GetTaskById;
using TaskService.Application.Features.Tasks.Queries.GetTaskEvidence;
using TaskService.Application.Features.Tasks.Queries.GetTasks;
using TaskService.Domain.Enums;

namespace TaskService.Api.Controllers;

[ApiController]
[Authorize]
[Route("task-service/[controller]")]
public class TasksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskDto>>> GetAll(
        [FromQuery] string? createdByUserId, 
        [FromQuery] string? assignedToUserId,
        CancellationToken cancellationToken)
    {
        var items = await mediator.Send(new GetTasksQuery(createdByUserId, assignedToUserId), cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetTaskByIdQuery(id), cancellationToken);
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskRequest request, CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest();

        var command = new CreateTaskCommand(
            request.Title,
            request.Description,
            request.CreatedByUserId,
            ResolveEvidenceRequirement(request.ConfirmationType),
            request.Difficulty,
            request.AssignedToUserId);

        var created = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskDto>> Update(Guid id, [FromBody] UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest();

        var command = new UpdateTaskCommand(
            id,
            request.Title,
            request.Description,
            request.Completed,
            request.ConfirmationType is null ? null : ResolveEvidenceRequirement(request.ConfirmationType),
            request.Difficulty);
        var updated = await mediator.Send(command, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new CompleteTaskCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/request-approval")]
    public async Task<IActionResult> RequestApproval(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new RequestApprovalCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new ApproveTaskCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new RejectApprovalCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/evidence")]
    public async Task<ActionResult<TaskDto>> UploadEvidence(Guid id, [FromForm] UploadTaskEvidenceRequest request, CancellationToken cancellationToken)
    {
        if (request?.File is null || request.File.Length == 0)
        {
            return BadRequest("A confirmation file must be attached.");
        }

        await using var buffer = new MemoryStream();
        await request.File.CopyToAsync(buffer, cancellationToken);
        var command = new SubmitTaskEvidenceCommand(
            id,
            request.UploadedByUserId,
            request.File.FileName,
            string.IsNullOrWhiteSpace(request.File.ContentType) ? "application/octet-stream" : request.File.ContentType,
            buffer.ToArray());

        var updated = await mediator.Send(command, cancellationToken);
        return Ok(updated);
    }

    [HttpGet("{id:guid}/evidence")]
    public async Task<IActionResult> DownloadEvidence(Guid id, CancellationToken cancellationToken)
    {
        var evidence = await mediator.Send(new GetTaskEvidenceQuery(id), cancellationToken);
        return File(evidence.Content, evidence.ContentType, evidence.FileName, enableRangeProcessing: true);
    }

    private static TaskEvidenceRequirement ResolveEvidenceRequirement(string? value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "photo" => TaskEvidenceRequirement.Photo,
            "video" => TaskEvidenceRequirement.Video,
            "document" => TaskEvidenceRequirement.Document,
            _ => TaskEvidenceRequirement.None
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteTaskCommand(id), cancellationToken);
        return NoContent();
    }
}