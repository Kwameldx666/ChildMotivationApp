using MediatR;
using TaskService.Application.Dto.Tasks;

namespace TaskService.Application.Features.Tasks.Queries.GetTasks;

public record GetTasksQuery(
    string? CreatedByUserId, 
    string? AssignedToUserId = null) : IRequest<IReadOnlyList<TaskDto>>;
