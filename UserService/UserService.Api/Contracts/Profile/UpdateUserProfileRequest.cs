namespace UserService.Api.Contracts.Profile;

public class UpdateUserProfileRequest
{
    public string? Name { get; set; }
    public string? LastName { get; set; }
    public string? Avatar { get; set; }
    public int? Age { get; set; }
}
