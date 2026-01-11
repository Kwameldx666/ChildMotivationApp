using MediatR;
using TaskService.Application.Dto.Tasks;
using TaskService.Domain.Enums;

namespace TaskService.Application.Features.Tasks.Commands.UpdateTask;

public record UpdateTaskCommand(
	Guid Id,
	string? Title,
	string? Description,
	bool? Completed,
	TaskEvidenceRequirement? EvidenceRequirement,
	int? Difficulty) : IRequest<TaskDto>; 
