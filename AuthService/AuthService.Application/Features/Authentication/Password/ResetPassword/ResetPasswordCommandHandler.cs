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
            return Result.Failure(HttpStatusCode.BadRequest, new Error
            {
                ErrorType = "UserNotFound",
                ErrorDescription = "Invalid reset link.",
                Impact = "Password reset cannot proceed.",
                Resolution = "Request a new password reset link."
            });

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, new Error
            {
                ErrorType = "ResetPasswordFailed",
                ErrorDescription = errors,
                Impact = "Password was not changed.",
                Resolution = "Fix the issues and try again."
            });
        }

        return Result.Success(HttpStatusCode.OK);
    }
}
