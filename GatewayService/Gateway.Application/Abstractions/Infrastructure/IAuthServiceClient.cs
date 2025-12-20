using System.Net.Http;
using Gateway.Application.Dto.Register;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAuthServiceClient
{
    Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
}