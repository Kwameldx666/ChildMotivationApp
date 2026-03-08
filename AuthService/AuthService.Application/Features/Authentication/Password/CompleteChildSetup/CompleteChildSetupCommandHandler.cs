using System.Net;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.Password.CompleteChildSetup;

public class CompleteChildSetupCommandHandler(UserManager<Domain.Entities.User> userManager)
    : IRequestHandler<CompleteChildSetupCommand, Result>
{
    public async Task<Result> Handle(CompleteChildSetupCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
            return Result.Failure(HttpStatusCode.NotFound,
                DefaultErrors.NotFound("User not found"));

        // Reset password using token (child already authenticated, no need to re-enter old password)
        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!resetResult.Succeeded)
        {
            var error = string.Join("; ", resetResult.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        // Clear the flag
        user.MustChangePassword = false;
        await userManager.UpdateAsync(user);

        return Result.Success(HttpStatusCode.OK);
    }
}
