namespace AuthService.Application.Dto.Auth.Login;

public class GenerateTokenResponse
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
}