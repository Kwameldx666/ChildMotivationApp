namespace AuthService.Application.Abstractions;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmationLink,
        CancellationToken cancellationToken = default);
}
