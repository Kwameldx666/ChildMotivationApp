namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAiServiceClient
{
    Task<System.Net.Http.HttpResponseMessage> GetTaskSuggestionsAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetRewardSuggestionsAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> SendChatAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetAnalyticsAsync(
        string userId,
        string? familyId,
        int? windowDays,
        int? maxInsights,
        CancellationToken cancellationToken = default);
}
