using System.Diagnostics.CodeAnalysis;
namespace UserService.Api.Contracts.Profile;

[ExcludeFromCodeCoverage]

public class UpdateUserProfileRequest
{
    public string? Name { get; set; }
    public string? LastName { get; set; }
    public string? Avatar { get; set; }
    public int? Age { get; set; }
}


