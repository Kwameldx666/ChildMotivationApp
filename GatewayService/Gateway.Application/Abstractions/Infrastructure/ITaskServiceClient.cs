namespace Gateway.Application.Abstractions.Infrastructure;

public interface ITaskServiceClient
{
    Task<HttpResponseMessage> GetAllAsync(
        string? createdByUserId = null,
        string? assignedToUserId = null,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> CreateAsync(object request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> UpdateAsync(Guid id, object request, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> CompleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetAnalyticsAsync(string userId, int windowDays,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> UploadEvidenceAsync(
        Guid id,
        Stream content,
        string fileName,
        string contentType,
        string uploadedByUserId,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> DownloadEvidenceAsync(Guid id, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetMissionsAsync(string userId, string? recurrence,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> UpdateMissionProgressAsync(Guid missionId, object request,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetAchievementsAsync(string userId, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> UpdateAchievementProgressAsync(Guid achievementId, object request,
        CancellationToken cancellationToken = default);
}