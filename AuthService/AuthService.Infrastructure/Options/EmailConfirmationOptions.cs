namespace AuthService.Infrastructure.Options;

public class EmailConfirmationOptions
{
    public string FrontendBaseUrl { get; set; } = "https://161.35.169.189";
    public string ConfirmEmailPath { get; set; } = "/confirm-email";
}
