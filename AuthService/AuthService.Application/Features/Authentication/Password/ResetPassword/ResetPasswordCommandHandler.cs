using System.Net;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.Password.ResetPassword;

public class ResetPasswordCommandHandler(
    UserManager<Domain.Entities.User> userManager)
    : IRequestHandler<ResetPasswordCommand, Result>
{
    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
            return Result.Failure("UserNotFound", "Invalid reset link.", HttpStatusCode.BadRequest);

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result.Failure("ResetPasswordFailed", errors, HttpStatusCode.BadRequest);
        }

        return Result.Success(HttpStatusCode.OK);
    }
}
