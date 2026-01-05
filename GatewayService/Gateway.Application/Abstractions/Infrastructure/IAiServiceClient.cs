namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAiServiceClient
{
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