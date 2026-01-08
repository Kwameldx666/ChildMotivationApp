namespace AiService.Application.Contracts;

public class AiTaskDescriptionRequest
{
    string TaskDescription { get; set; } = string.Empty;
    int MaxSuggestions { get; init; }
    private string Language { get; init; } = string.Empty;
}