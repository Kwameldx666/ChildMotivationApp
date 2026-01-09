using Gateway.Contracts.Ai;

namespace Gateway.Application.Abstractions.Infrastructure;
//TODO: I need to change all the objects onto real models for consequence. 
public interface IAiServiceClient
{
    Task<HttpResponseMessage> GetTaskSuggestionsAsync(AiTaskSuggestionsRequest request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> GetRewardSuggestionsAsync(object request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> SendChatAsync(object request, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetAnalyticsAsync(
        string userId,
        string? familyId,
        int? windowDays,
        int? maxInsights,
        CancellationToken cancellationToken = default);
}