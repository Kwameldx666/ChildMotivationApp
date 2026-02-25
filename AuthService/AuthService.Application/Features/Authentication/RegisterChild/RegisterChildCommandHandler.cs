using System.Net;
using System.Security.Cryptography;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Common.Constants.Errors;
using AuthService.Common.Constants.User;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.RegisterChild;

public class RegisterChildCommandHandler(
    UserManager<User> userManager,
    IEmailService emailService)
    : IRequestHandler<RegisterChildCommand, Result>
{
    public async Task<Result> Handle(RegisterChildCommand request, CancellationToken cancellationToken)
    {
        var parent = await userManager.FindByEmailAsync(request.ParentEmail);
        if (parent is null || !await userManager.CheckPasswordAsync(parent, request.ParentPassword))
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Неверные учётные данные родителя."));

        if (parent.UserType != UserType.Parent)
            return Result.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest("Только родитель может создать аккаунт ребёнка."));

        if (!parent.EmailConfirmed)
            return Result.Failure(HttpStatusCode.Forbidden,
                DefaultErrors.BadRequest(
                    "Для создания аккаунта ребёнка необходимо сначала подтвердить вашу электронную почту."));

        if (string.IsNullOrWhiteSpace(parent.FamilyCode))
            return Result.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("У родителя нет семейного кода."));

        var childPassword = GenerateRandomPassword(10);

        var childEmail = GenerateChildEmail(parent, request.ChildName);

        var existingUser = await userManager.FindByEmailAsync(childEmail);
        if (existingUser is not null)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"Пользователь с почтой {childEmail} уже существует."));

        var child = new User
        {
            Email = childEmail,
            UserName = childEmail,
            EmailConfirmed = true,
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

        var htmlBody = $"""
                         <h2>Аккаунт ребёнка создан</h2>
                         <p>Здравствуйте, {parent.Name ?? parent.Email}!</p>
                         <p>Вы успешно создали аккаунт для ребёнка <strong>{request.ChildName} {request.ChildLastName}</strong>.</p>
                         <p>Данные для входа:</p>
                         <ul>
                             <li><strong>Логин (email):</strong> {childEmail}</li>
                             <li><strong>Пароль:</strong> {childPassword}</li>
                         </ul>
                         <p>Рекомендуем сменить пароль после первого входа.</p>
                         """;

        await emailService.SendEmailAsync(parent.Email!, "Аккаунт ребёнка создан — FamilyTasks", htmlBody,
            cancellationToken);

        return Result.Success(HttpStatusCode.Created);
    }

    private static string GenerateChildEmail(User parent, string childName)
    {
        var sanitized = childName.Trim().ToLowerInvariant().Replace(" ", "");
        var familyCode = parent.FamilyCode?.ToLowerInvariant() ?? "family";
        return $"{sanitized}.{familyCode}@familytasks.local";
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
}
