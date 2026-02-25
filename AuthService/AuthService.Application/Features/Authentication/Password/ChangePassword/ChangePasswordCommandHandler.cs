using System.Net;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.Password.ChangePassword;

public class ChangePasswordCommandHandler(UserManager<Domain.Entities.User> userManager)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
            return Result.Failure(HttpStatusCode.NotFound,
                DefaultErrors.NotFound("User not found"));

        var changeResult = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changeResult.Succeeded)
        {
            var error = string.Join("; ", changeResult.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        return Result.Success(HttpStatusCode.OK);
    }
}
