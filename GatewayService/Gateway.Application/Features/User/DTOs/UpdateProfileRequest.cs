using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.User.DTOs;

public class UpdateProfileRequest
{
    [StringLength(128, MinimumLength = 2, ErrorMessage = "Имя должно быть от 2 до 128 символов")]
    public string? Name { get; set; }

    [StringLength(128, MinimumLength = 2, ErrorMessage = "Фамилия должна быть от 2 до 128 символов")]
    public string? LastName { get; set; }

    [StringLength(512)]
    public string? Avatar { get; set; }

    [Range(1, 120, ErrorMessage = "Возраст должен быть от 1 до 120")]
    public int? Age { get; set; }
}