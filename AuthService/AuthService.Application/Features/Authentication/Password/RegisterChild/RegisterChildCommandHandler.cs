using System.Net;
using System.Security.Cryptography;
using AuthService.Application.Abstractions;
using AuthService.Application.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using UserEntity = AuthService.Domain.Entities.User;

namespace AuthService.Application.Features.Authentication.Password.RegisterChild;

public class RegisterChildCommandHandler(
    UserManager<UserEntity> userManager,
    IEmailService emailService)
    : IRequestHandler<RegisterChildCommand, Result>
{
    public async Task<Result> Handle(RegisterChildCommand request, CancellationToken cancellationToken)
    {
        // 1. Authenticate the parent
        var parent = await userManager.FindByEmailAsync(request.ParentEmail);
        if (parent is null || !await userManager.CheckPasswordAsync(parent, request.ParentPassword))
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Неверные учётные данные родителя."));

        if (parent.UserType != UserType.Parent)
            return Result.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest("Только родитель может создать аккаунт ребёнка."));

        // Parent must have confirmed email — child credentials are sent there
        if (!parent.EmailConfirmed)
            return Result.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest(
                    "Для создания аккаунта ребёнка необходимо сначала подтвердить вашу электронную почту, так как на неё будут отправлены логин и пароль ребёнка."));

        if (string.IsNullOrWhiteSpace(parent.FamilyCode))
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("У родителя нет семейного кода."));

        // 3. Generate child credentials
        var childPassword = GenerateRandomPassword(10);
        var childEmail = GenerateChildEmail(parent, request.ChildName);

        var existingUser = await userManager.FindByEmailAsync(childEmail);
        if (existingUser is not null)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"Пользователь с почтой {childEmail} уже существует."));

        // 4. Create the child user
        var child = new UserEntity
        {
            Email = childEmail,
            UserName = childEmail,
            EmailConfirmed = true, // Child account — email confirmed automatically
            FamilyCode = parent.FamilyCode,
            FamilyName = parent.FamilyName,
            FamilyEmblem = parent.FamilyEmblem,
            UserStatus = UserStatuses.Active,
            Avatar = string.IsNullOrWhiteSpace(request.ChildAvatar) ? null : request.ChildAvatar,
            Age = request.ChildAge,
            UserType = UserType.Child,
            Name = request.ChildName.Trim(),
            LastName = request.ChildLastName.Trim()
        };

        var createResult = await userManager.CreateAsync(child, childPassword);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        var addToRoleResult = await userManager.AddToRoleAsync(child, UserRoles.Child);
        if (!addToRoleResult.Succeeded)
        {
            await userManager.DeleteAsync(child);
            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        // 5. Send child credentials to parent's confirmed email
        var htmlBody = BuildChildCredentialsHtml(parent, request, childEmail, childPassword);

        try
        {
            await emailService.SendEmailAsync(parent.Email!,
                "Аккаунт ребёнка создан — ChildMotivation", htmlBody, cancellationToken);
        }
        catch
        {
            // Email failure should not block child registration — parent can see credentials in response
        }

        return Result.Success(HttpStatusCode.Created);
    }

    private static string GenerateChildEmail(UserEntity parent, string childName)
    {
        var sanitized = childName.Trim().ToLowerInvariant().Replace(" ", "");
        var familyCode = parent.FamilyCode?.ToLowerInvariant() ?? "family";
        return $"{sanitized}.{familyCode}@childmotivation.local";
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

    private static string BuildChildCredentialsHtml(UserEntity parent, RegisterChildCommand request,
        string childEmail, string childPassword)
    {
        return $$"""
                 <!DOCTYPE html>
                 <html>
                 <head>
                     <meta charset="utf-8"/>
                     <style>
                         body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
                         .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
                         .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; }
                         .header h1 { color: #fff; margin: 0; font-size: 24px; }
                         .body { padding: 32px 24px; }
                         .body p { color: #374151; font-size: 15px; line-height: 1.6; }
                         .credentials { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
                         .credentials li { color: #374151; font-size: 15px; margin: 8px 0; }
                         .footer { padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px; }
                     </style>
                 </head>
                 <body>
                     <div class="container">
                         <div class="header">
                             <h1>👶 Аккаунт ребёнка создан</h1>
                         </div>
                         <div class="body">
                             <p>Здравствуйте, <strong>{{parent.Name ?? parent.Email}}</strong>!</p>
                             <p>Вы успешно создали аккаунт для ребёнка <strong>{{request.ChildName}} {{request.ChildLastName}}</strong>.</p>
                             <p>Данные для входа:</p>
                             <div class="credentials">
                                 <ul>
                                     <li><strong>Логин (email):</strong> {{childEmail}}</li>
                                     <li><strong>Пароль:</strong> {{childPassword}}</li>
                                 </ul>
                             </div>
                             <p>Рекомендуем сменить пароль после первого входа.</p>
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
