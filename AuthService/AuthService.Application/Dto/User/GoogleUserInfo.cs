namespace AuthService.Application.Dto.User;

public class GoogleUserInfo
{
    public string Sub { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Picture { get; set; } = null!;
}