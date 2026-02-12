using System.Net;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.Password.ChangeEmail;

public class ChangeEmailCommandHandler(UserManager<Domain.Entities.User> userManager)
    : IRequestHandler<ChangeEmailCommand, Result>
{
    public async Task<Result> Handle(ChangeEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
            return Result.Failure(HttpStatusCode.NotFound,
                DefaultErrors.NotFound("User not found"));

        // Verify current password first
        var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Current password is incorrect"));

        // Check if email is already taken
        var existingUser = await userManager.FindByEmailAsync(request.NewEmail);
        if (existingUser is not null && existingUser.Id != user.Id)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"Email {request.NewEmail} is already in use"));

        // Update email and username (since username = email in this system)
        user.Email = request.NewEmail;
        user.UserName = request.NewEmail;
        user.NormalizedEmail = request.NewEmail.ToUpperInvariant();
        user.NormalizedUserName = request.NewEmail.ToUpperInvariant();

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var error = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        return Result.Success(HttpStatusCode.OK);
    }
}
