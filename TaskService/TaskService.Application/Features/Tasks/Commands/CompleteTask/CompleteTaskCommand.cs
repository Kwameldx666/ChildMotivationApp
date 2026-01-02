using MediatR;

namespace TaskService.Application.Features.Tasks.Commands.CompleteTask;

public record CompleteTaskCommand(Guid Id) : IRequest;
