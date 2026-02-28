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

        // Verify current (temporary) password
        var passwordValid = await userManager.CheckPasswordAsync(user, request.CurrentPassword);
        if (!passwordValid)
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Текущий пароль неверен."));

        // Change password
        var changeResult = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changeResult.Succeeded)
        {
            var error = string.Join("; ", changeResult.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        // Clear the flag
        user.MustChangePassword = false;
        await userManager.UpdateAsync(user);

        return Result.Success(HttpStatusCode.OK);
    }
}
