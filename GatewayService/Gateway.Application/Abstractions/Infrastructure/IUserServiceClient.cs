using System.Net.Http;
using Gateway.Application.Dto.Profile;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IUserServiceClient
{
    Task<HttpResponseMessage> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken);
}
