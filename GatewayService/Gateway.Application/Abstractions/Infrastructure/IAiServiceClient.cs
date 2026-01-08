using Gateway.Application.Features.Ai.DTOs;

namespace Gateway.Application.Abstractions.Infrastructure;
//TODO: I need to change all the objects onto real models for consequence. 
public interface IAiServiceClient
{
    Task<HttpResponseMessage> GetTaskDescriptionAsync(AiTaskDescriptionRequest  request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> GetTaskSuggestionsAsync(object request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> GetRewardSuggestionsAsync(object request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> SendChatAsync(object request, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetAnalyticsAsync(
        string userId,
        string? familyId,
        int? windowDays,
        int? maxInsights,
        CancellationToken cancellationToken = default);
}