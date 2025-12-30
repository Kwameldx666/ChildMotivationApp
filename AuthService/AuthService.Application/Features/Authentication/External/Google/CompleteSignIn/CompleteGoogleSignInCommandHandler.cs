using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.External.Google.CompleteSignIn;

public class CompleteGoogleSignInCommandHandler(
    IOAuthPendingUserStore pendingUserStore,
    UserManager<Domain.Entities.User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder)
    : IRequestHandler<CompleteGoogleSignInCommand, Result<ExternalLoginResponse>>
{
    public async Task<Result<ExternalLoginResponse>> Handle(CompleteGoogleSignInCommand request,
        CancellationToken cancellationToken)
    {
        var pendingUser = await pendingUserStore.TakeAsync(request.PendingToken, cancellationToken);
        if (pendingUser is null)
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Registration token is invalid or has expired."));

        var normalizedRole = request.Role.Trim();
        if (!Enum.TryParse<UserType>(normalizedRole, true, out var userType))
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Provided role is not supported."));

        var existingUser = await userManager.FindByEmailAsync(pendingUser.Email);
        if (existingUser is not null)
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"User with email {pendingUser.Email} already exists."));

        if (userType == UserType.Child && request.Age is null)
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Age is required for the child role."));

        var (familyCode, familyName, familyEmblem, errorResult) = await FamilyContextResolver.ResolveAsync(
            userManager,
            userType,
            request.FamilyCode,
            request.FamilyName,
            request.FamilyEmblem,
            cancellationToken);

        if (errorResult is not null)
            return Result<ExternalLoginResponse>.Failure((HttpStatusCode)errorResult.StatusCode, errorResult.Error!);

        var (defaultFirstName, defaultLastName) = SplitName(pendingUser.Name);

        var firstName = string.IsNullOrWhiteSpace(request.Name) ? defaultFirstName : request.Name.Trim();
        var lastName = string.IsNullOrWhiteSpace(request.LastName) ? defaultLastName : request.LastName.Trim();

        var avatar = string.IsNullOrWhiteSpace(request.Avatar) ? pendingUser.Picture : request.Avatar!.Trim();

        var newUser = new Domain.Entities.User
        {
            Email = pendingUser.Email,
            UserName = pendingUser.Email,
            EmailConfirmed = true,
            FamilyCode = familyCode,
            FamilyName = familyName,
            FamilyEmblem = familyEmblem,
            UserStatus = UserStatuses.Active,
            Avatar = avatar,
            Age = request.Age,
            UserType = userType,
            Name = firstName,
            LastName = lastName
        };

        var createResult = await userManager.CreateAsync(newUser);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        var addToRoleResult = await userManager.AddToRoleAsync(newUser, normalizedRole);
        if (!addToRoleResult.Succeeded)
        {
            await userManager.DeleteAsync(newUser);

            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        var sessionResult = await externalLoginSessionBuilder.CreateAsync(
            newUser,
            cancellationToken);

        return sessionResult;
    }

    private static (string firstName, string lastName) SplitName(string source)
    {
        if (string.IsNullOrWhiteSpace(source)) return ("", "");

        var parts = source.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return (source.Trim(), source.Trim());

        if (parts.Length == 1)
        {
            var value = parts[0].Trim();
            return (value, value);
        }

        return (parts[0].Trim(), parts[1].Trim());
    }
}