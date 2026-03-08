using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterRequest(
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    [StringLength(256)]
    string Email,
    [Required(ErrorMessage = "Пароль обязателен")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Пароль должен быть от 8 до 128 символов")]
    string Password,
    [Required(ErrorMessage = "Роль обязательна")]
    [StringLength(32)]
    string Role,
    [Required(ErrorMessage = "Профиль обязателен")]
    RegisterProfile Profile,
    RegisterFamily Family
);