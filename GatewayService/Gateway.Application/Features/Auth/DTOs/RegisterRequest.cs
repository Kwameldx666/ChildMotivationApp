using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterRequest(
    [property: Required(ErrorMessage = "Email обязателен")]
    [property: EmailAddress(ErrorMessage = "Некорректный формат email")]
    [property: StringLength(256)]
    string Email,
    [property: Required(ErrorMessage = "Пароль обязателен")]
    [property: StringLength(128, MinimumLength = 8, ErrorMessage = "Пароль должен быть от 8 до 128 символов")]
    string Password,
    [property: Required(ErrorMessage = "Роль обязательна")]
    [property: StringLength(32)]
    string Role,
    [property: Required(ErrorMessage = "Профиль обязателен")]
    RegisterProfile Profile,
    RegisterFamily Family
);