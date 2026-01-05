using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Tasks;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Queries.GetTaskEvidence;

public class GetTaskEvidenceQueryHandler : IRequestHandler<GetTaskEvidenceQuery, TaskEvidenceFileResult>
{
    private readonly ITaskRepository _repository;
    private readonly ITaskEvidenceStorage _storage;

    public GetTaskEvidenceQueryHandler(ITaskRepository repository, ITaskEvidenceStorage storage)
    {
        _repository = repository;
        _storage = storage;
    }

    public async Task<TaskEvidenceFileResult> Handle(GetTaskEvidenceQuery request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.TaskId);
        }

        if (!task.EvidenceSubmitted || string.IsNullOrWhiteSpace(task.EvidenceStoragePath))
        {
            throw new NotFoundException("TaskEvidence", request.TaskId);
        }

        var stream = await _storage.OpenReadAsync(task.EvidenceStoragePath, cancellationToken);
        var contentType = task.EvidenceContentType ?? "application/octet-stream";
        var fileName = string.IsNullOrWhiteSpace(task.EvidenceFileName) ? $"evidence-{request.TaskId}" : task.EvidenceFileName;
        return new TaskEvidenceFileResult(stream, contentType, fileName);
    }
}
