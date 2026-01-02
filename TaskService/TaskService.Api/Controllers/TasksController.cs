using Microsoft.AspNetCore.Mvc;
using TaskService.Api.Contracts.Tasks;
using TaskService.Infrastructure.Abstractions;
using TaskService.Domain.Entities;

namespace TaskService.Api.Controllers;

[ApiController]
[Route("task-service/[controller]")]
public class TasksController(ITaskStore store) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? createdByUserId, CancellationToken cancellationToken)
    {
        var items = await store.GetAllAsync(createdByUserId, cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await store.GetAsync(id, cancellationToken);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskItem item, CancellationToken cancellationToken)
    {
        if (item is null) return BadRequest();
        if (string.IsNullOrWhiteSpace(item.CreatedByUserId))
            return BadRequest("CreatedByUserId is required.");
        var created = await store.CreateAsync(item, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest();
        var existing = await store.GetAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Title)) existing.Title = request.Title;
        if (request.Description is not null) existing.Description = request.Description;
        if (request.Completed.HasValue) existing.Completed = request.Completed.Value;

        var ok = await store.UpdateAsync(existing, cancellationToken);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        var ok = await store.CompleteAsync(id, cancellationToken);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var ok = await store.DeleteAsync(id, cancellationToken);
        if (!ok) return NotFound();
        return NoContent();
    }
}