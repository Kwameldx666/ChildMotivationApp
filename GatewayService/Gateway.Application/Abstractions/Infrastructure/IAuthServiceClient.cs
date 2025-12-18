using Gateway.Application.Dto.Auth;
using Gateway.Application.Dto.Register;
using Gateway.Common.ResultPattern;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAuthServiceClient
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
}