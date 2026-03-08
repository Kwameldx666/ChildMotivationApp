using MediatR;

namespace TaskService.Application.Features.Tasks.Commands.ApproveTask;

public record ApproveTaskCommand(Guid Id) : IRequest;
