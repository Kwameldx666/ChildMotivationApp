using System.Net;
using System.Text;
using AuthService.Application.Abstractions;
using AuthService.Application.Dto.User;
using AuthService.Application.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.Password.Register;

public class RegisterUserCommandHandler(
    UserManager<Domain.Entities.User> userManager,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<RegisterUserCommandHandler> logger)
    : IRequestHandler<RegisterUserCommand, Result>
{
    public async Task<Result> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        if (user is not null)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"User with email {request.Email} already exists"));

        var userType = Enum.Parse<UserType>(request.Role.Trim(), true);

        var (familyCode, familyName, familyEmblem, errorResult) = await FamilyContextResolver.ResolveAsync(
            userManager,
            userType,
            request.Code,
            request.FamilyName,
            request.Emblem,
            cancellationToken);
        if (errorResult is not null) return errorResult;

        var newUser = new Domain.Entities.User
        {
            Email = request.Email,
            UserName = request.Email,
            EmailConfirmed = false,
            FamilyCode = familyCode,
            FamilyName = familyName,
            FamilyEmblem = familyEmblem,
            UserStatus = UserStatuses.Active,
            Avatar = string.IsNullOrWhiteSpace(request.Avatar) ? null : request.Avatar,
            Age = request.Age,
            UserType = userType,
            Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name,
            LastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName
        };

        var createResult = await userManager.CreateAsync(newUser, request.Password);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result.Failure(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        var addToRoleResult = await userManager.AddToRoleAsync(newUser, request.Role);
        if (!addToRoleResult.Succeeded)
        {
            await userManager.DeleteAsync(newUser);

            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            return Result.Failure(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        // Generate email confirmation token and enqueue confirmation email (non-blocking)
        try
        {
            var token = await userManager.GenerateEmailConfirmationTokenAsync(newUser);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var frontendBaseUrl = configuration["EmailConfirmation:FrontendBaseUrl"] ?? "https://161.35.169.189";
            var confirmPath = configuration["EmailConfirmation:ConfirmEmailPath"] ?? "/confirm-email";
            var confirmationLink = $"{frontendBaseUrl}{confirmPath}?userId={newUser.Id}&token={encodedToken}";

            var userName = newUser.Name ?? newUser.Email ?? "User";

            _ = Task.Run(async () =>
            {
                try
                {
                    await emailService.SendEmailConfirmationAsync(
                        newUser.Email!,
                        userName,
                        confirmationLink,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to send confirmation email to {Email}. User was created successfully.",
                        request.Email);
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to prepare confirmation email for {Email}. User was created successfully.",
                request.Email);
            // Don't fail registration if email sending fails — user can resend later
        }

        return Result.Success(HttpStatusCode.Created);
    }
}