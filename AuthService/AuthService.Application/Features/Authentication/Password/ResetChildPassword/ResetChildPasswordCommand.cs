using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.ResetChildPassword;

public record ResetChildPasswordCommand(
    Guid ParentId,
    Guid ChildId) : IRequest<Result<ResetChildPasswordResponse>>;

public record ResetChildPasswordResponse(
    string NewPassword);
