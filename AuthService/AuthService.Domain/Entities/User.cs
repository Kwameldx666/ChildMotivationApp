using Microsoft.AspNetCore.Identity;

namespace AuthService.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string? FamilyCode { get; set; } = null!;
    public string UserStatus { get; set; } = null!;
}