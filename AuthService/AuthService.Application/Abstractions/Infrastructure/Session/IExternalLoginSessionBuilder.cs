using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.ResultPattern;

namespace AuthService.Application.Abstractions.Infrastructure.Session;

public interface IExternalLoginSessionBuilder
{
    public Task<Result<ExternalLoginResponse>> CreateAsync(Domain.Entities.User user,
        CancellationToken cancellationToken);
}