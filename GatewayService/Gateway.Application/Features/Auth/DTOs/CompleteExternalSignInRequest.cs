using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record CompleteExternalSignInRequest
{
    [Required(ErrorMessage = "Токен обязателен")]
    [StringLength(512)]
    public required string PendingToken { get; init; }

    [Required(ErrorMessage = "Роль обязательна")]
    [StringLength(32)]
    public required string Role { get; init; }

    [Required(ErrorMessage = "Имя обязательно")]
    [StringLength(128, MinimumLength = 2)]
    public required string Name { get; init; }

    [Required(ErrorMessage = "Фамилия обязательна")]
    [StringLength(128, MinimumLength = 2)]
    public required string LastName { get; init; }

    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    [StringLength(256)]
    public string? Email { get; init; }

    [StringLength(256)]
    public string? Avatar { get; init; }

    [Range(1, 150, ErrorMessage = "Возраст должен быть от 1 до 150")]
    public int? Age { get; init; }

    [StringLength(64)]
    public string? FamilyCode { get; init; }

    [StringLength(128)]
    public string? FamilyName { get; init; }

    [StringLength(128)]
    public string? FamilyEmblem { get; init; }
}