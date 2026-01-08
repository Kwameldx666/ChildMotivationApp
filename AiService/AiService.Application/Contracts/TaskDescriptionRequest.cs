namespace AiService.Application.Contracts;

public class TaskDescriptionRequest
{
    public string TaskDescription { get; set; } = string.Empty;
    public string Language { get; init; } = string.Empty;
}