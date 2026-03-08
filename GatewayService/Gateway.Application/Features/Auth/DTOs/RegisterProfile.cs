using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterProfile(
    [Required(ErrorMessage = "Имя обязательно")]
    [StringLength(128, MinimumLength = 2, ErrorMessage = "Имя должно быть от 2 до 128 символов")]
    string Name,
    [Required(ErrorMessage = "Фамилия обязательна")]
    [StringLength(128, MinimumLength = 2, ErrorMessage = "Фамилия должна быть от 2 до 128 символов")]
    string LastName,
    [StringLength(256)]
    string? Avatar,
    [StringLength(32)]
    string? Role,
    [Range(1, 150, ErrorMessage = "Возраст должен быть от 1 до 150")]
    int? Age
);