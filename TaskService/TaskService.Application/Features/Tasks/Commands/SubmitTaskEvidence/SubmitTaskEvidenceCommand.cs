using MediatR;
using TaskService.Application.Dto.Tasks;

namespace TaskService.Application.Features.Tasks.Commands.SubmitTaskEvidence;

public record SubmitTaskEvidenceCommand(
    Guid TaskId,
    string UploadedByUserId,
    string FileName,
    string ContentType,
    byte[] Content) : IRequest<TaskDto>;
