using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.ResendConfirmation;

public record ResendConfirmationCommand(string Email) : IRequest<Result>;
