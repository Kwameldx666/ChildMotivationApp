using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.CompleteChildSetup;

public record CompleteChildSetupCommand(
    Guid UserId,
    string NewPassword) : IRequest<Result>;
