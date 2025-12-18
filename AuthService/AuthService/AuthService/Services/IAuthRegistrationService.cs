using AuthService.Contracts;

namespace AuthService.Services;

public interface IAuthRegistrationService
{
    AuthResponse Register(RegisterRequest request);
}
