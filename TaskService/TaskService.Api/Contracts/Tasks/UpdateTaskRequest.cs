using System.ComponentModel.DataAnnotations;

namespace TaskService.Api.Contracts.Tasks;

public class UpdateTaskRequest
{
    [StringLength(256)]
    public string? Title { get; init; }

    [StringLength(2000)]
    public string? Description { get; init; }

    public bool? Completed { get; init; }

    [StringLength(16)]
    public string? ConfirmationType { get; init; }
}
