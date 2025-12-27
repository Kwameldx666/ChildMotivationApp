using AuthService.Application.Models.Auth.Login;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Login;

public record LoginUserCommand(string Email, string Password) : IRequest<Result<LoginResponse>>;