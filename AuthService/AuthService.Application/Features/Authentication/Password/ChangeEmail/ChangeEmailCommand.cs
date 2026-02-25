using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.ChangeEmail;

public record ChangeEmailCommand(Guid UserId, string NewEmail, string Password) : IRequest<Result>;
