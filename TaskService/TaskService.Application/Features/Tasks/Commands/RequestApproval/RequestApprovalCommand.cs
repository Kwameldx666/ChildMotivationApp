using MediatR;

namespace TaskService.Application.Features.Tasks.Commands.RequestApproval;

public record RequestApprovalCommand(Guid Id) : IRequest;
