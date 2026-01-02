using MediatR;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Mappings;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Queries.GetTaskById;

public class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDto>
{
    private readonly ITaskRepository _repository;

    public GetTaskByIdQueryHandler(ITaskRepository repository)
    {
        _repository = repository;
    }

    public async Task<TaskDto> Handle(GetTaskByIdQuery request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.Id);
        }

        return task.ToDto();
    }
}
