using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.ConfirmEmail;

public record ConfirmEmailCommand(string UserId, string Token) : IRequest<Result>;
