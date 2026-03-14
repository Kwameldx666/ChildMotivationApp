using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace AiService.Application.Contracts;

[ExcludeFromCodeCoverage]

public class TaskDescriptionRequest
{
    [Required(ErrorMessage = "Описание задачи обязательно")]
    [StringLength(2000, ErrorMessage = "Описание не может превышать 2000 символов")]
    public string TaskDescription { get; set; } = string.Empty;

    [StringLength(16)]
    public string Language { get; init; } = string.Empty;
}

