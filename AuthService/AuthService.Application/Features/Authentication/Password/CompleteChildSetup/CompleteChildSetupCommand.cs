using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.CompleteChildSetup;

public record CompleteChildSetupCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword) : IRequest<Result>;
