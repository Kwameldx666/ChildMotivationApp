using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.GitHub.SignIn;

public record GitHubSignInCommand(string State, string Code) : IRequest<Result<ExternalSignInResult>>;
