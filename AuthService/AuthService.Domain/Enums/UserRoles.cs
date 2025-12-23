namespace AuthService.Domain.Enums;

public static class UserRoles
{
    public static readonly string Parent = "Parent";
    public static readonly string Child = "Child";

    public static readonly string[] All = [Parent, Child];
}