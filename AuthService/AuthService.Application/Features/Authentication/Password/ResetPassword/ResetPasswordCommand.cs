using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.ResetPassword;

public record ResetPasswordCommand(Guid UserId, string Token, string NewPassword) : IRequest<Result>;
