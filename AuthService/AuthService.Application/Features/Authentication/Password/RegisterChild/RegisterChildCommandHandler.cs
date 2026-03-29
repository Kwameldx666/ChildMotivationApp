using System.Net;
using System.Security.Cryptography;
using AuthService.Application.Abstractions;
using AuthService.Application.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using UserEntity = AuthService.Domain.Entities.User;

namespace AuthService.Application.Features.Authentication.Password.RegisterChild;

public class RegisterChildCommandHandler(
    UserManager<UserEntity> userManager,
    IEmailService emailService,
    ILogger<RegisterChildCommandHandler> logger)
    : IRequestHandler<RegisterChildCommand, Result<RegisterChildResponse>>
{
    public async Task<Result<RegisterChildResponse>> Handle(RegisterChildCommand request, CancellationToken cancellationToken)
    {
        // 1. Find the parent by ID (extracted from JWT in the gateway/controller)
        var parent = await userManager.FindByIdAsync(request.ParentId.ToString());
        if (parent is null)
            return Result<RegisterChildResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Родитель не найден."));

        if (parent.UserType != UserType.Parent)
            return Result<RegisterChildResponse>.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest("Только родитель может создать аккаунт ребёнка."));

        if (string.IsNullOrWhiteSpace(parent.FamilyCode))
            return Result<RegisterChildResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("У родителя нет семейного кода."));

        // 2. Generate child credentials
        var childPassword = GenerateRandomPassword(10);
        var childLogin = GenerateChildLogin(request.ChildName);

        var existingUser = await userManager.FindByNameAsync(childLogin);
        if (existingUser is not null)
            return Result<RegisterChildResponse>.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"Пользователь с логином {childLogin} уже существует."));

        // 3. Create the child user
        var child = new UserEntity
        {
            UserName = childLogin,
            EmailConfirmed = true, // Child account — no email needed
            FamilyCode = parent.FamilyCode,
            FamilyName = parent.FamilyName,
            FamilyEmblem = parent.FamilyEmblem,
            UserStatus = UserStatuses.Active,
            Avatar = string.IsNullOrWhiteSpace(request.ChildAvatar) ? null : request.ChildAvatar,
            Age = request.ChildAge,
            UserType = UserType.Child,
            Name = request.ChildName.Trim(),
            LastName = request.ChildLastName?.Trim(),
            MustChangePassword = true
        };

        var createResult = await userManager.CreateAsync(child, childPassword);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result<RegisterChildResponse>.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(error));
        }

        var addToRoleResult = await userManager.AddToRoleAsync(child, UserRoles.Child);
        if (!addToRoleResult.Succeeded)
        {
            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            logger.LogWarning(
                "Child account {ChildId} was created, but role assignment failed: {Errors}",
                child.Id,
                error);
        }

        // 4. Try to send child credentials to parent's email (only if confirmed)
        if (parent.EmailConfirmed && !string.IsNullOrWhiteSpace(parent.Email))
        {
            var htmlBody = BuildChildCredentialsHtml(parent, request, childLogin, childPassword);
            try
            {
                // Use a short timeout so email delivery failure doesn't block child registration
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                await emailService.SendEmailAsync(parent.Email!,
                    "Аккаунт ребёнка создан — ChildMotivation", htmlBody, cts.Token);                                                         
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send child credentials email to {Email}", parent.Email);
                // Email failure should not block child registration — parent can see credentials in response
            }
        }

        // 5. Always return credentials so parent can see them in the UI
        var response = new RegisterChildResponse(
            ChildEmail: childLogin,
            ChildPassword: childPassword,
            ChildName: request.ChildName.Trim(),
            ChildLastName: request.ChildLastName?.Trim() ?? "");

        return Result<RegisterChildResponse>.Success(response, HttpStatusCode.Created);
    }

    private static string GenerateChildLogin(string childName)
    {
        var name = childName.Trim().ToLowerInvariant().Replace(" ", "");

        // Truncate long names to keep login manageable
        if (name.Length > 12)
            name = name[..12];

        // Generate a 4-digit random suffix for better uniqueness and complexity
        var suffix = RandomNumberGenerator.GetInt32(1000, 9999).ToString();

        // Add a random letter prefix to avoid trivially guessable logins
        const string letters = "abcdefghijklmnopqrstuvwxyz";
        var randomChar = letters[RandomNumberGenerator.GetInt32(letters.Length)];

        return $"{name}_{randomChar}{suffix}";
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
                                     <li><strong>Логин:</strong> {{childEmail}}</li></li>
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
