using System;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using AuthService.Common.Constants;
using AuthService.Common.Constants.Errors;
using AuthService.Common.Constants.User;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Application.Features.Authentication.RegisterUser;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Result>
{
    private readonly UserManager<User> _userManager;

    public RegisterUserCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is not null)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"User with email {request.Email} already exists"));

        var userType = Enum.Parse<UserType>(request.Role.Trim(), true);

        var (familyCode, familyName, familyEmblem, errorResult) = await ResolveFamilyContextAsync(userType, request, cancellationToken);
        if (errorResult is not null)
        {
            return errorResult;
        }

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
            var errorDescription = createResult.Errors.FirstOrDefault()?.Description ?? "Failed to create user";
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(errorDescription));
        }

        return Result.Success(HttpStatusCode.Created);
    }

    private async Task<(string? code, string? name, string? emblem, Result? error)> ResolveFamilyContextAsync(
        UserType userType,
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        if (userType == UserType.Parent)
        {
            var familyName = request.FamilyName?.Trim();
            var familyEmblem = string.IsNullOrWhiteSpace(request.Emblem) ? null : request.Emblem.Trim();
            var desiredCode = string.IsNullOrWhiteSpace(request.Code)
                ? null
                : request.Code.Trim().ToUpperInvariant();

            if (!string.IsNullOrWhiteSpace(desiredCode))
            {
                var codeInUse = await _userManager.Users
                    .AnyAsync(u => u.FamilyCode == desiredCode, cancellationToken);

                if (codeInUse)
                {
                    return (null, null, null, Result.Failure(HttpStatusCode.Conflict,
                        DefaultErrors.Conflict("Family code is already in use.")));
                }

                return (desiredCode, familyName, familyEmblem, null);
            }

            var generatedCode = await GenerateUniqueFamilyCodeAsync(cancellationToken);
            return (generatedCode, familyName, familyEmblem, null);
        }

        if (userType == UserType.Child)
        {
            var normalizedCode = request.Code?.Trim().ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(normalizedCode))
            {
                return (null, null, null, Result.Failure(HttpStatusCode.BadRequest,
                    DefaultErrors.BadRequest("Family code is required to join an existing family.")));
            }

            var familyOwner = await _userManager.Users
                .Where(u => u.FamilyCode == normalizedCode)
                .OrderByDescending(u => u.UserType == UserType.Parent)
                .FirstOrDefaultAsync(cancellationToken);

            if (familyOwner is null)
            {
                return (null, null, null, Result.Failure(HttpStatusCode.NotFound,
                    DefaultErrors.NotFound("Family with the provided code was not found.")));
            }

            return (familyOwner.FamilyCode, familyOwner.FamilyName, familyOwner.FamilyEmblem, null);
        }

        var fallbackCode = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code.Trim().ToUpperInvariant();
        var fallbackName = string.IsNullOrWhiteSpace(request.FamilyName) ? null : request.FamilyName.Trim();
        var fallbackEmblem = string.IsNullOrWhiteSpace(request.Emblem) ? null : request.Emblem.Trim();

        return (fallbackCode, fallbackName, fallbackEmblem, null);
    }

    private async Task<string> GenerateUniqueFamilyCodeAsync(CancellationToken cancellationToken)
    {
        const int maxAttempts = 32;

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var code = GenerateFamilyCode();
            var exists = await _userManager.Users.AnyAsync(u => u.FamilyCode == code, cancellationToken);

            if (!exists)
            {
                return code;
            }
        }

        // Fallback to GUID-based code when random attempts exhausted
        var fallback = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return fallback;
    }

    private static string GenerateFamilyCode()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Span<char> buffer = stackalloc char[6];

        for (var i = 0; i < buffer.Length; i++)
        {
            var index = RandomNumberGenerator.GetInt32(alphabet.Length);
            buffer[i] = alphabet[index];
        }

        return new string(buffer);
    }
}