using MediatR;
using TaskService.Application.Dto.Tasks;

namespace TaskService.Application.Features.Tasks.Queries.GetTaskEvidence;

public record GetTaskEvidenceQuery(Guid TaskId) : IRequest<TaskEvidenceFileResult>;
