using AuthService.Application.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.LoginUser;

public record LoginUserCommand(string Email, string Password) : IRequest<Result<LoginResponse>>;