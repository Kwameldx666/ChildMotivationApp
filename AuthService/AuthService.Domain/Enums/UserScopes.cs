namespace AuthService.Domain.Enums;

public static class UserScopes
{
    public const string UserWrite = "user:write";
    public const string UserRead =  "user:read";
    public const string UserDelete = "user:delete";
    public const string ShopAdmin = "shop:admin";
    public const string ShopRead = "shop:read";

    public static readonly string[] ParentScopes = [UserWrite, UserRead, UserDelete, ShopAdmin, ShopRead];
    public static readonly string[] ChildScopes = [UserWrite, UserRead, ShopRead];
    public static readonly string[] All = [UserWrite, UserRead, UserDelete, ShopAdmin, ShopRead, UserDelete];
}