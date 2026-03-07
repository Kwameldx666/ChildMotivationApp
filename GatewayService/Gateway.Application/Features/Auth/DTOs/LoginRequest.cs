using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record LoginRequest(
    [property: Required(ErrorMessage = "Email обязателен")]
    [property: EmailAddress(ErrorMessage = "Некорректный формат email")]
    [property: StringLength(256)]
    string Email,
    [property: Required(ErrorMessage = "Пароль обязателен")]
    [property: StringLength(128)]
    string Password
);