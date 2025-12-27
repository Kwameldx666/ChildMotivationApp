using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.SignIn;

public record GoogleSignInCommand(string Code, string State) : IRequest<Result<ExternalSignInResult>>;