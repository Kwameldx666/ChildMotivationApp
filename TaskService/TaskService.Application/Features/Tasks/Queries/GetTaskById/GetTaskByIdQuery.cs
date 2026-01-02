using MediatR;
using TaskService.Application.Dto.Tasks;

namespace TaskService.Application.Features.Tasks.Queries.GetTaskById;

public record GetTaskByIdQuery(Guid Id) : IRequest<TaskDto>;
