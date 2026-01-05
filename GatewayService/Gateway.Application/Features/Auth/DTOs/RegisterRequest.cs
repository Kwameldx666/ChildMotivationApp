namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string Role,
    RegisterProfile Profile,
    RegisterFamily Family
);