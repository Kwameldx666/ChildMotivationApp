using AiService.Application.Contracts;

namespace AiService.Application.Abstractions;

public interface IAiOrchestrator
{
    Task<TaskSuggestionsResponse> GenerateTaskSuggestionsAsync(TaskSuggestionsRequest request,
        CancellationToken cancellationToken);   
    
    Task<TaskDescriptionResponse> GenerateTaskDescriptionAsync(TaskDescriptionRequest request,
        CancellationToken cancellationToken);

    Task<RewardSuggestionsResponse> GenerateRewardSuggestionsAsync(RewardSuggestionsRequest request,
        CancellationToken cancellationToken);

    Task<AiChatResponse> ProcessChatAsync(AiChatRequest request, CancellationToken cancellationToken);
    Task<AiAnalyticsResponse> BuildAnalyticsAsync(AiAnalyticsRequest request, CancellationToken cancellationToken);
}