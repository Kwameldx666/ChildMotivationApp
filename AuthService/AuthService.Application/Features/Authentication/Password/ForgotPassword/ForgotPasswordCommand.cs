using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<Result>;
