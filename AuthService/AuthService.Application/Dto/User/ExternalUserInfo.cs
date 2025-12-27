namespace AuthService.Application.Dto.User;

public interface IExternalUserInfo
{
    public string Sub { get; set; } 
    public string Email { get; set; } 
    public string Name { get; set; } 
    public string Picture { get; set; }
}

public class ExternalUserInfo : IExternalUserInfo
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Picture { get; set; } = string.Empty;
    public string Sub { get; set; } = string.Empty;
}

public class PendingExternalUser
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Picture { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
}
