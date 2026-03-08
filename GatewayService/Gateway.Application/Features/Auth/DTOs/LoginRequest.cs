using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record LoginRequest(
    [Required(ErrorMessage = "Email обязателен")]
    [StringLength(256)]
    string Email,
    [Required(ErrorMessage = "Пароль обязателен")]
    [StringLength(128)]
    string Password
);