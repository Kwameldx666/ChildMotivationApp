using System.Net;
using System.Text;
using AuthService.Application.Abstractions;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Features.Authentication.Password.ForgotPassword;

public class ForgotPasswordCommandHandler(
    UserManager<Domain.Entities.User> userManager,
    IEmailService emailService,
    IConfiguration configuration)
    : IRequestHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        // User not found — return success to avoid email enumeration
        if (user is null)
            return Result.Success(HttpStatusCode.OK);

        // If email is not confirmed, return a specific error so the frontend can notify the user
        if (!user.EmailConfirmed)
            return Result.Failure("EmailNotConfirmed",
                "Your email is not confirmed. Please confirm your email first before resetting the password.",
                HttpStatusCode.BadRequest);

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var frontendBaseUrl = configuration["EmailConfirmation:FrontendBaseUrl"] ?? "http://localhost:3000";
        var resetPath = configuration["EmailConfirmation:ResetPasswordPath"] ?? "/reset-password";
        var resetLink = $"{frontendBaseUrl}{resetPath}?userId={user.Id}&token={encodedToken}";

        var userName = user.Name ?? user.Email ?? "User";

        var htmlBody = BuildResetPasswordHtml(userName, resetLink);
        await emailService.SendEmailAsync(user.Email!, "Reset your password — ChildMotivation", htmlBody, cancellationToken);

        return Result.Success(HttpStatusCode.OK);
    }

    private static string BuildResetPasswordHtml(string userName, string resetLink)
    {
        return $"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8" /></head>
                <body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:20px;">
                  <div style="max-width:480px;margin:auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <h2 style="color:#7c3aed;">Password Reset</h2>
                    <p>Hi <strong>{userName}</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align:center;margin:24px 0;">
                      <a href="{resetLink}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
                        Reset Password
                      </a>
                    </div>
                    <p style="font-size:13px;color:#888;">If you didn't request a password reset, you can safely ignore this email.</p>
                    <p style="font-size:13px;color:#888;">This link will expire in 24 hours.</p>
                  </div>
                </body>
                </html>
                """;
    }
}
