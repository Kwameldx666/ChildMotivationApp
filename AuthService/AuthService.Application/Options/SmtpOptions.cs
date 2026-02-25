using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.Options;

public class SmtpOptions
{
    [Required] public string Host { get; set; } = "localhost";
    [Range(1, 65535)] public int Port { get; set; } = 1025;
    public string? UserName { get; set; }
    public string? Password { get; set; }
    [Required] public string FromEmail { get; set; } = "noreply@familytasks.local";
    [Required] public string FromName { get; set; } = "FamilyTasks";
    public bool UseSsl { get; set; } = false;
}
