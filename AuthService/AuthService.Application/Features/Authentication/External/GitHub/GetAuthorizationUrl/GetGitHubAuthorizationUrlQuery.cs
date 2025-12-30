using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;

public record GetGitHubAuthorizationUrlQuery : IRequest<Result<AuthorizationUrlResponse>>;