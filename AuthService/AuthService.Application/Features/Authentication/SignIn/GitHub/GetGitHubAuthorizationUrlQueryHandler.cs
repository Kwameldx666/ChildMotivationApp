using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GitHub;

public class GetGitHubAuthorizationUrlQueryHandler(IGoogleStateStore) : IRequestHandler<GetGitHubAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public Task<Result<AuthorizationResponse>> Handle(GetGitHubAuthorizationUrlQuery request, CancellationToken cancellationToken)
    {
        var state = 
    }
}