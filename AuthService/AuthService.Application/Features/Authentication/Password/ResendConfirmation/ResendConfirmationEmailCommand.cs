using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.ResendConfirmation;

public record ResendConfirmationEmailCommand(string Email) : IRequest<Result>;
