using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;

public record GetGitHubAuthorizationUrlQuery : IRequest<Result<AuthorizationResponse>>;