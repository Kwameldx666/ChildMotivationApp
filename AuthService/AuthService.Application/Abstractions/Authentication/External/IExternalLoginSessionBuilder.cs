using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IExternalLoginSessionBuilder
{
    Task<Result<ExternalLoginResponse>> CreateAsync(Domain.Entities.User user,
        CancellationToken cancellationToken);
}