using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace TaskService.Api.Contracts.Tasks;

[ExcludeFromCodeCoverage]

public class CreateTaskRequest
{
    [Required]
    [StringLength(256)]
    public string Title { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Required]
    [StringLength(64)]
    public string CreatedByUserId { get; init; } = string.Empty;

    [Range(1,5)]
    public int? Difficulty { get; init; }

    [StringLength(16)]
    public string ConfirmationType { get; init; } = "none";

    [StringLength(64)]
    public string? AssignedToUserId { get; init; } // ID of the child to whom the task is assigned
}


