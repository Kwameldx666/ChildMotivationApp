using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Tasks;

public class CreateTaskRequest
{
    [Required] [StringLength(256)] public string Title { get; init; } = string.Empty;

    [StringLength(2000)] public string? Description { get; init; }

    [Range(1, 5)] public int? Difficulty { get; init; }

    [StringLength(64)] public string? AssignedToUserId { get; init; }

    [StringLength(16)] public string? ConfirmationType { get; init; }
}