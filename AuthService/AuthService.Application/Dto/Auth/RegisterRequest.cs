namespace AuthService.Application.Dto.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string Role,
    RegisterProfile Profile,
    RegisterFamily? Family
);