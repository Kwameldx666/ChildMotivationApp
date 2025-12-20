using AuthService.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string? FamilyCode { get; set; }
    public string UserStatus { get; set; } = null!;
    public string? Avatar { get; set; }
    public int? Age { get; set; }
    public UserType UserType { get; set; }
}