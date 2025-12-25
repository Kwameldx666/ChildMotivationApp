using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GetGooglePendingUser;

public record GetGooglePendingUserQuery(string Token) : IRequest<Result<GooglePendingUserResponse>>;