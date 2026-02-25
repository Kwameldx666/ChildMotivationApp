using TaskService.Application.Dto.Tasks;
using TaskService.Domain.Entities;

namespace TaskService.Application.Mappings;

public static class TaskMappingExtensions
{
    public static TaskDto ToDto(this TaskItem task)
    {
        return new TaskDto(
            task.Id,
            task.Title,
            task.Description,
            task.Completed,
            task.CreatedAt,
            task.UpdatedAt,
            task.CompletedAt,
            task.CreatedByUserId,
            task.Difficulty,
            task.RewardXp,
            task.RewardPoints,
            new TaskEvidenceDto(
                task.EvidenceRequirement,
                task.EvidenceSubmitted,
                task.EvidenceFileName,
                task.EvidenceContentType,
                task.EvidenceFileSize,
                task.EvidenceUploadedAt,
                task.EvidenceUploadedBy));
    }

    public static IReadOnlyList<TaskDto> ToDtoList(this IEnumerable<TaskItem> tasks)
    {
        return tasks.Select(ToDto).ToList();
    }
}
