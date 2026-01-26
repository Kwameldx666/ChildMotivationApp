using MediatR;
using TaskService.Application.Dto.Tasks;
using TaskService.Domain.Enums;

namespace TaskService.Application.Features.Tasks.Commands.CreateTask;

public record CreateTaskCommand(
	string Title,
	string? Description,
	string CreatedByUserId,
	TaskEvidenceRequirement EvidenceRequirement,
	int? Difficulty,
	string? AssignedToUserId = null) : IRequest<TaskDto>; 
