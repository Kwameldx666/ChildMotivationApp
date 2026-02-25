using System.Net;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.ConfirmEmail;

public class ConfirmEmailCommandHandler(UserManager<User> userManager)
    : IRequestHandler<ConfirmEmailCommand, Result>
{
    public async Task<Result> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Invalid user identifier."));

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(HttpStatusCode.NotFound,
                DefaultErrors.NotFound("User not found."));

        if (user.EmailConfirmed)
            return Result.Success(HttpStatusCode.OK);

        var result = await userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            var error = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest($"Email confirmation failed: {error}"));
        }

        return Result.Success(HttpStatusCode.OK);
    }
}
