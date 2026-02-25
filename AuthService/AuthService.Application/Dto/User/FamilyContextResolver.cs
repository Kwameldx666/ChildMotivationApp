using System.Net;
using System.Security.Cryptography;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Application.Dto.User;

internal static class FamilyContextResolver
{
    private const int GeneratedCodeLength = 6;

    public static async Task<(string? code, string? name, string? emblem, Result? error)> ResolveAsync(
        UserManager<Domain.Entities.User> userManager,
        UserType userType,
        string? code,
        string? familyName,
        string? emblem,
        CancellationToken cancellationToken)
    {
        if (userType == UserType.Parent)
        {
            var trimmedName = string.IsNullOrWhiteSpace(familyName) ? null : familyName.Trim();
            var trimmedEmblem = string.IsNullOrWhiteSpace(emblem) ? null : emblem.Trim();
            var desiredCode = string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpperInvariant();

            if (!string.IsNullOrWhiteSpace(desiredCode))
            {
                var codeInUse = await userManager.Users
                    .AnyAsync(u => u.FamilyCode == desiredCode, cancellationToken);

                if (codeInUse)
                    return (null, null, null, Result.Failure(HttpStatusCode.Conflict,
                        DefaultErrors.Conflict("Family code is already in use.")));

                return (desiredCode, trimmedName, trimmedEmblem, null);
            }

            var generatedCode = await GenerateUniqueFamilyCodeAsync(userManager, cancellationToken);
            return (generatedCode, trimmedName, trimmedEmblem, null);
        }

        if (userType == UserType.Child)
        {
            var normalizedCode = code?.Trim().ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(normalizedCode))
                return (null, null, null, Result.Failure(HttpStatusCode.BadRequest,
                    DefaultErrors.BadRequest("Family code is required to join an existing family.")));

            var familyOwner = await userManager.Users
                .Where(u => u.FamilyCode == normalizedCode)
                .OrderByDescending(u => u.UserType == UserType.Parent)
                .FirstOrDefaultAsync(cancellationToken);

            if (familyOwner is null)
                return (null, null, null, Result.Failure(HttpStatusCode.NotFound,
                    DefaultErrors.NotFound("Family with the provided code was not found.")));

            return (familyOwner.FamilyCode, familyOwner.FamilyName, familyOwner.FamilyEmblem, null);
        }

        var fallbackCode = string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpperInvariant();
        var fallbackName = string.IsNullOrWhiteSpace(familyName) ? null : familyName.Trim();
        var fallbackEmblem = string.IsNullOrWhiteSpace(emblem) ? null : emblem.Trim();

        return (fallbackCode, fallbackName, fallbackEmblem, null);
    }

    private static async Task<string> GenerateUniqueFamilyCodeAsync(UserManager<Domain.Entities.User> userManager,
        CancellationToken cancellationToken)
    {
        const int maxAttempts = 32;
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var code = GenerateFamilyCode(alphabet);
            var exists = await userManager.Users.AnyAsync(u => u.FamilyCode == code, cancellationToken);

            if (!exists) return code;
        }

        var fallback = Guid.NewGuid().ToString("N")[..GeneratedCodeLength].ToUpperInvariant();
        return fallback;
    }

    private static string GenerateFamilyCode(string alphabet)
    {
        Span<char> buffer = stackalloc char[GeneratedCodeLength];

        for (var i = 0; i < buffer.Length; i++)
        {
            var index = RandomNumberGenerator.GetInt32(alphabet.Length);
            buffer[i] = alphabet[index];
        }

        return new string(buffer);
    }
}