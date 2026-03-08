using MediatR;

namespace TaskService.Application.Features.Tasks.Commands.RejectApproval;

public record RejectApprovalCommand(Guid Id) : IRequest;
