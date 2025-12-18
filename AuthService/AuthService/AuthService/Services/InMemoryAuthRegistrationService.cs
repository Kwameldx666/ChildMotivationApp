using System.Collections.Concurrent;
using AuthService.Contracts;

namespace AuthService.Services;

public sealed class InMemoryAuthRegistrationService : IAuthRegistrationService
{
    private readonly ConcurrentDictionary<string, AuthResponse> _users = new(StringComparer.OrdinalIgnoreCase);

    public AuthResponse Register(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (_users.ContainsKey(normalizedEmail))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());

        var user = new AuthUser(
            Guid.NewGuid(),
            request.Email,
            request.Profile.Name,
            request.Profile.LastName
        );

        var profileRole = string.IsNullOrWhiteSpace(request.Profile.Role)
            ? request.Role
            : request.Profile.Role!;

        var profile = new UserProfile(
            request.Profile.Name,
            request.Profile.LastName,
            request.Profile.Avatar,
            profileRole,
            request.Profile.Age
        );

        var family = request.Family is null
            ? null
            : new FamilyContext(
                request.Family.Code,
                request.Family.Name,
                request.Family.Emblem
            );

        var response = new AuthResponse(token, user, profile, family);

        _users[normalizedEmail] = response;
        return response;
    }
}
