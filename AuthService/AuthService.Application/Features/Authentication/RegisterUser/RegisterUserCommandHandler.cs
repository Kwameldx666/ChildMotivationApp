using System;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Web;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Common.Constants;
using AuthService.Common.Constants.Errors;
using AuthService.Common.Constants.User;
using AuthService.Common.ResultPattern;
using AuthService.Application.Features.Authentication.Shared;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Application.Features.Authentication.RegisterUser;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Result>
{
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;

    public RegisterUserCommandHandler(UserManager<User> userManager, IEmailService emailService)
    {
        _userManager = userManager;
        _emailService = emailService;
    }

    public async Task<Result> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is not null)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"User with email {request.Email} already exists"));

        var userType = Enum.Parse<UserType>(request.Role.Trim(), true);

        var (familyCode, familyName, familyEmblem, errorResult) = await FamilyContextResolver.ResolveAsync(
            _userManager,
            userType,
            request.Code,
            request.FamilyName,
            request.Emblem,
            cancellationToken);
        if (errorResult is not null) return errorResult;

        var newUser = new User
        {
            Email = request.Email,
            UserName = request.Email,
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

        var createResult = await _userManager.CreateAsync(newUser, request.Password);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result.Failure(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        var addToRoleResult = await _userManager.AddToRoleAsync(newUser, request.Role);
        if (!addToRoleResult.Succeeded)
        {
            await _userManager.DeleteAsync(newUser);

            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            return Result.Failure(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        if (userType == UserType.Parent)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(newUser);
            var encodedToken = HttpUtility.UrlEncode(token);

            var confirmUrl =
                $"http://localhost:8080/auth-service/auth/confirm-email?userId={newUser.Id}&token={encodedToken}";

            var htmlBody = $"""
                            <h2>Подтверждение электронной почты</h2>
                            <p>Здравствуйте, {newUser.Name ?? newUser.Email}!</p>
                            <p>Для подтверждения вашей почты перейдите по ссылке:</p>
                            <p><a href="{confirmUrl}">Подтвердить почту</a></p>
                            <p>Если вы не регистрировались на нашем сервисе, проигнорируйте это письмо.</p>
                            """;

            try
            {
                await _emailService.SendEmailAsync(newUser.Email!, "Подтверждение почты — FamilyTasks", htmlBody,
                    cancellationToken);
            }
            catch
            {
                // Email sending failure should not block registration
            }
        }
        else
        {
            // Child accounts registered directly get email confirmed automatically
            newUser.EmailConfirmed = true;
            await _userManager.UpdateAsync(newUser);
        }

        return Result.Success(HttpStatusCode.Created);
    }
}