using System.Net.Http;
using Gateway.Application.Dto.Profile;

namespace Gateway.Application.Interfaces.Infrastructure;

public interface IUserServiceClient
{
    Task<HttpResponseMessage> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetCurrentProfileAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken);
}
