using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.SignIn;

public record GoogleSignInCommand(string Code, string State) : IRequest<Result<ExternalSignInResult>>;