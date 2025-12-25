using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GoogleSignIn;

public record GoogleSignInCommand(string Code, string State) : IRequest<Result<GoogleSignInResult>>;