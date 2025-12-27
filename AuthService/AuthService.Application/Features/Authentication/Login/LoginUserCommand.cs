using AuthService.Application.Dto;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.LoginUser;

public record LoginUserCommand(string Email, string Password) : IRequest<Result<LoginResponse>>;