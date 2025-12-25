namespace Gateway.Application.Dto.Auth;

public class CompleteGoogleSignInRequest
{
    public string PendingToken { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Avatar { get; set; }
    public int? Age { get; set; }
    public string? FamilyCode { get; set; }
    public string? FamilyName { get; set; }
    public string? FamilyEmblem { get; set; }
}
