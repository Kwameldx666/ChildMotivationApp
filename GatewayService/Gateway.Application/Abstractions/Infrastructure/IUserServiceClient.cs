using Gateway.Application.Features.User.DTOs;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IUserServiceClient
{
    Task<HttpResponseMessage> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetCurrentProfileAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetFamilyMembersAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetCurrentFamilyMembersAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> UpdateProfileAsync(Guid userId, UpdateProfileRequest request,
        CancellationToken cancellationToken);

    Task<HttpResponseMessage> UploadAvatarAsync(Guid userId, Stream fileStream, string fileName, string contentType,
        CancellationToken cancellationToken);
    
    // Subscription
    Task<HttpResponseMessage> GetCurrentSubscriptionAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetSubscriptionAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> ChangeSubscriptionAsync(ChangeSubscriptionRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> CancelSubscriptionAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetSubscriptionTiersAsync(CancellationToken cancellationToken);
}