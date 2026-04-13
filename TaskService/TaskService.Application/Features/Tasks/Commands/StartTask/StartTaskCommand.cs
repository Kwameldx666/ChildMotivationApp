using MediatR;

namespace TaskService.Application.Features.Tasks.Commands.StartTask;

public record StartTaskCommand(Guid Id, string? ActingUserId = null) : IRequest;
