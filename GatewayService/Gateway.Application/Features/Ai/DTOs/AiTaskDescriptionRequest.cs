using System.Collections.ObjectModel;

namespace Gateway.Application.Features.Ai.DTOs;

public class AiTaskDescriptionRequest
{
    public string TaskDescription { get; set; } = string.Empty;
    public string Language { get; init; } = "ru";
}