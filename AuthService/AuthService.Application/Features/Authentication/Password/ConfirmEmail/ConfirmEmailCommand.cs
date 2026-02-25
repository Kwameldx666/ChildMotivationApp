using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.ConfirmEmail;

public record ConfirmEmailCommand(Guid UserId, string Token) : IRequest<Result>;
