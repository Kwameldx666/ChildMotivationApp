using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TaskService.Api.Contracts.Tasks;

public class UploadTaskEvidenceRequest
{
    [Required]
    public IFormFile File { get; init; } = default!;

    [Required]
    [StringLength(64)]
    public string UploadedByUserId { get; init; } = string.Empty;
}
