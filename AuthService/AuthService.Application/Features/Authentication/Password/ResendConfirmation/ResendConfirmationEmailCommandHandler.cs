using System.Net;
using AuthService.Application.Abstractions;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;

namespace AuthService.Application.Features.Authentication.Password.ResendConfirmation;

public class ResendConfirmationEmailCommandHandler(
    UserManager<Domain.Entities.User> userManager,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<ResendConfirmationEmailCommandHandler> logger)
    : IRequestHandler<ResendConfirmationEmailCommand, Result>
{
    public async Task<Result> Handle(ResendConfirmationEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        // Always return success to avoid email enumeration
        if (user is null)
            return Result.Success(HttpStatusCode.OK);

        if (user.EmailConfirmed)
            return Result.Success(HttpStatusCode.OK);

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var frontendBaseUrl = configuration["EmailConfirmation:FrontendBaseUrl"] ?? "https://161.35.169.189";
        var confirmPath = configuration["EmailConfirmation:ConfirmEmailPath"] ?? "/confirm-email";
        var confirmationLink = $"{frontendBaseUrl}{confirmPath}?userId={user.Id}&token={encodedToken}";

        var userName = user.Name ?? user.Email ?? "User";

        _ = emailService.SendEmailConfirmationAsync(user.Email!, userName, confirmationLink, CancellationToken.None)
            .ContinueWith(task =>
            {
                if (task.Exception is not null)
                {
                    logger.LogError(task.Exception.Flatten(),
                        "Failed to resend confirmation email to {Email}.",
                        request.Email);
                }
            }, TaskContinuationOptions.OnlyOnFaulted);

        return Result.Success(HttpStatusCode.OK);
    }
}
