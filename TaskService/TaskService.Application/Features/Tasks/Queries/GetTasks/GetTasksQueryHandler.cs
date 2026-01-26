using MediatR;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Mappings;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Queries.GetTasks;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, IReadOnlyList<TaskDto>>
{
    private readonly ITaskRepository _repository;

    public GetTasksQueryHandler(ITaskRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<TaskDto>> Handle(GetTasksQuery request, CancellationToken cancellationToken)
    {
        var tasks = await _repository.GetAsync(
            request.CreatedByUserId, 
            request.AssignedToUserId, 
            cancellationToken);
        return tasks.ToDtoList();
    }
}
