using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterProfile(
    [property: Required(ErrorMessage = "Имя обязательно")]
    [property: StringLength(128, MinimumLength = 2, ErrorMessage = "Имя должно быть от 2 до 128 символов")]
    string Name,
    [property: Required(ErrorMessage = "Фамилия обязательна")]
    [property: StringLength(128, MinimumLength = 2, ErrorMessage = "Фамилия должна быть от 2 до 128 символов")]
    string LastName,
    [property: StringLength(256)]
    string? Avatar,
    [property: StringLength(32)]
    string? Role,
    [property: Range(1, 150, ErrorMessage = "Возраст должен быть от 1 до 150")]
    int? Age
);