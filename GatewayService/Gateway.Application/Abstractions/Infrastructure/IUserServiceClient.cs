using Gateway.Application.Dto.Profile;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IUserServiceClient
{
    Task<HttpResponseMessage> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetCurrentProfileAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetFamilyMembersAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetCurrentFamilyMembersAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> UpdateProfileAsync(Guid userId, UpdateProfileRequest request,
        CancellationToken cancellationToken);

    Task<HttpResponseMessage> UploadAvatarAsync(Guid userId, System.IO.Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken);
}