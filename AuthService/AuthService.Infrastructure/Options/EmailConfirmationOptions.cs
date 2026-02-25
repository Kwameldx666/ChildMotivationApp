namespace AuthService.Infrastructure.Options;

public class EmailConfirmationOptions
{
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";
    public string ConfirmEmailPath { get; set; } = "/confirm-email";
}
