namespace Gateway.Application.Abstractions.Infrastructure;

public interface ITaskServiceClient
{
    Task<System.Net.Http.HttpResponseMessage> GetAllAsync(string? createdByUserId = null, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> CreateAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UpdateAsync(Guid id, object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> CompleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UploadEvidenceAsync(
        Guid id,
        Stream content,
        string fileName,
        string contentType,
        string uploadedByUserId,
        CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> DownloadEvidenceAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetMissionsAsync(string userId, string? recurrence, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UpdateMissionProgressAsync(Guid missionId, object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetAchievementsAsync(string userId, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UpdateAchievementProgressAsync(Guid achievementId, object request, CancellationToken cancellationToken = default);
}
