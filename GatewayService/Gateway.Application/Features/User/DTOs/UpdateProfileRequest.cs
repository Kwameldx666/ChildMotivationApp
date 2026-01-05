namespace Gateway.Application.Features.User.DTOs;

public class UpdateProfileRequest
{
    public string? Name { get; set; }
    public string? LastName { get; set; }
    public string? Avatar { get; set; }
    public int? Age { get; set; }
}