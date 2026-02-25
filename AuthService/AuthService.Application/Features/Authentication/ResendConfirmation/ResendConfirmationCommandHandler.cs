using System.Net;
using System.Web;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.ResendConfirmation;

public class ResendConfirmationCommandHandler(
    UserManager<User> userManager,
    IEmailService emailService)
    : IRequestHandler<ResendConfirmationCommand, Result>
{
    public async Task<Result> Handle(ResendConfirmationCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Result.Success(HttpStatusCode.OK);

        if (user.UserType != UserType.Parent)
            return Result.Success(HttpStatusCode.OK);

        if (user.EmailConfirmed)
            return Result.Success(HttpStatusCode.OK);

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = HttpUtility.UrlEncode(token);

        var confirmUrl =
            $"http://localhost:8080/auth-service/auth/confirm-email?userId={user.Id}&token={encodedToken}";

        var htmlBody = $"""
                        <h2>Подтверждение электронной почты</h2>
                        <p>Здравствуйте, {user.Name ?? user.Email}!</p>
                        <p>Для подтверждения вашей почты перейдите по ссылке:</p>
                        <p><a href="{confirmUrl}">Подтвердить почту</a></p>
                        <p>Если вы не регистрировались на нашем сервисе, проигнорируйте это письмо.</p>
                        """;

        await emailService.SendEmailAsync(user.Email!, "Подтверждение почты — FamilyTasks", htmlBody,
            cancellationToken);

        return Result.Success(HttpStatusCode.OK);
    }
}
