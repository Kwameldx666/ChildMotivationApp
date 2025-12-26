using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GitHub;

public record GetGitHubAuthorizationUrlQuery() : IRequest<Result<AuthorizationResponse>>;