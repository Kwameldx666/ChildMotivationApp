using System.Net;
using System.Security.Cryptography;
using AuthService.Application.Abstractions;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using UserEntity = AuthService.Domain.Entities.User;

namespace AuthService.Application.Features.Authentication.Password.ResetChildPassword;

public class ResetChildPasswordCommandHandler(
    UserManager<UserEntity> userManager,
    IEmailService emailService)
    : IRequestHandler<ResetChildPasswordCommand, Result<ResetChildPasswordResponse>>
{
    public async Task<Result<ResetChildPasswordResponse>> Handle(
        ResetChildPasswordCommand request, CancellationToken cancellationToken)
    {
        // 1. Find and validate the parent
        var parent = await userManager.FindByIdAsync(request.ParentId.ToString());
        if (parent is null)
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.NotFound,
                DefaultErrors.NotFound("Родитель не найден."));

        if (parent.UserType != UserType.Parent)
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest("Только родитель может сбросить пароль ребёнка."));

        // 2. Find the child
        var child = await userManager.FindByIdAsync(request.ChildId.ToString());
        if (child is null)
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.NotFound,
                DefaultErrors.NotFound("Ребёнок не найден."));

        if (child.UserType != UserType.Child)
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Указанный пользователь не является ребёнком."));

        // 3. Verify same family
        if (string.IsNullOrWhiteSpace(parent.FamilyCode) ||
            parent.FamilyCode != child.FamilyCode)
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest("Ребёнок не принадлежит к вашей семье."));

        // 4. Generate new password and reset
        var newPassword = GenerateRandomPassword(10);

        var removeResult = await userManager.RemovePasswordAsync(child);
        if (!removeResult.Succeeded)
        {
            var error = string.Join("; ", removeResult.Errors.Select(e => e.Description));
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        var addResult = await userManager.AddPasswordAsync(child, newPassword);
        if (!addResult.Succeeded)
        {
            var error = string.Join("; ", addResult.Errors.Select(e => e.Description));
            return Result<ResetChildPasswordResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        // Mark child to change password on next login
        child.MustChangePassword = true;
        await userManager.UpdateAsync(child);

        // 5. Optionally notify parent by email
        if (parent.EmailConfirmed && !string.IsNullOrWhiteSpace(parent.Email))
        {
            var htmlBody = BuildResetNotificationHtml(parent, child, newPassword);
            try
            {
                await emailService.SendEmailAsync(parent.Email!,
                    "Пароль ребёнка сброшен — ChildMotivation", htmlBody, new CancellationTokenSource(TimeSpan.FromSeconds(3)).Token);
            }
            catch
            {
                // Email failure should not block the operation
            }
        }

        return Result<ResetChildPasswordResponse>.Success(
            new ResetChildPasswordResponse(newPassword), HttpStatusCode.OK);
    }

    private static string GenerateRandomPassword(int length)
    {
        const string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lower = "abcdefghijklmnopqrstuvwxyz";
        const string digits = "0123456789";
        const string all = upper + lower + digits;

        var password = new char[length];
        password[0] = upper[RandomNumberGenerator.GetInt32(upper.Length)];
        password[1] = lower[RandomNumberGenerator.GetInt32(lower.Length)];
        password[2] = digits[RandomNumberGenerator.GetInt32(digits.Length)];

        for (var i = 3; i < length; i++)
            password[i] = all[RandomNumberGenerator.GetInt32(all.Length)];

        RandomNumberGenerator.Shuffle(password.AsSpan());

        return new string(password);
    }

    private static string BuildResetNotificationHtml(UserEntity parent, UserEntity child, string newPassword)
    {
        return $$"""
                 <!DOCTYPE html>
                 <html>
                 <head>
                     <meta charset="utf-8"/>
                     <style>
                         body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
                         .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
                         .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 24px; text-align: center; }
                         .header h1 { color: #fff; margin: 0; font-size: 24px; }
                         .body { padding: 32px 24px; }
                         .body p { color: #374151; font-size: 15px; line-height: 1.6; }
                         .credentials { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0; }
                         .credentials li { color: #374151; font-size: 15px; margin: 8px 0; }
                         .footer { padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px; }
                     </style>
                 </head>
                 <body>
                     <div class="container">
                         <div class="header">
                             <h1>🔑 Пароль ребёнка сброшен</h1>
                         </div>
                         <div class="body">
                             <p>Здравствуйте, <strong>{{parent.Name ?? parent.Email}}</strong>!</p>
                             <p>Вы сбросили пароль для аккаунта <strong>{{child.Name}} {{child.LastName}}</strong>.</p>
                             <p>Новые данные для входа:</p>
                             <div class="credentials">
                                 <ul>
                                     <li><strong>Логин:</strong> {{child.UserName}}</li>
                                     <li><strong>Новый пароль:</strong> {{newPassword}}</li>
                                 </ul>
                             </div>
                             <p>Рекомендуем ребёнку сменить пароль после входа.</p>
                         </div>
                         <div class="footer">
                             &copy; ChildMotivation App
                         </div>
                     </div>
                 </body>
                 </html>
                 """;
    }
}
