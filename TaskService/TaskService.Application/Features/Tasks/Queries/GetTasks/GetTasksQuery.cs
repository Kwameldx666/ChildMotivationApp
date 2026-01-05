using MediatR;
using TaskService.Application.Dto.Tasks;

namespace TaskService.Application.Features.Tasks.Queries.GetTasks;

public record GetTasksQuery(string? CreatedByUserId) : IRequest<IReadOnlyList<TaskDto>>;
