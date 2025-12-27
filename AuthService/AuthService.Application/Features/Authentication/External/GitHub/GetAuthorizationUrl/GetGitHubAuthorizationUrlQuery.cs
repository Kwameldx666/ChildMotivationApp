using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GitHub.GetAuthorizationUrl;

public record GetGitHubAuthorizationUrlQuery() : IRequest<Result<AuthorizationResponse>>;