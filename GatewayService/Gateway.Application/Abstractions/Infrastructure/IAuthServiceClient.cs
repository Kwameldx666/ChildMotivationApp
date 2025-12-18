using Gateway.Application.Dto.Register;
using Gateway.Common.ResultPattern;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAuthServiceClient
{
    Task<Result> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
}