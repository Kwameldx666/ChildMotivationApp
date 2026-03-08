using AuthService.Application.Abstractions;
using AuthService.Infrastructure.Options;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace AuthService.Infrastructure.Services.Email;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpOptions _smtp;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpOptions> smtpOptions, ILogger<SmtpEmailService> logger)
    {
        _smtp = smtpOptions.Value;
        _logger = logger;
    }

    public async Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmationLink,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Confirm your email — ChildMotivation";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = BuildConfirmationHtml(userName, confirmationLink),
            TextBody = $"Hi {userName},\n\nPlease confirm your email by visiting this link:\n{confirmationLink}\n\nIf you did not create an account, you can safely ignore this email."
        };

        message.Body = bodyBuilder.ToMessageBody();

        await SendMimeMessageAsync(message, toEmail, cancellationToken);
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        await SendMimeMessageAsync(message, to, cancellationToken);
    }

    private async Task SendMimeMessageAsync(MimeMessage message, string toEmail,
        CancellationToken cancellationToken)
    {
        try
        {
            using var client = new SmtpClient();
            var sslOptions = _smtp.UseSsl
                ? (_smtp.Port == 465
                    ? MailKit.Security.SecureSocketOptions.SslOnConnect
                    : MailKit.Security.SecureSocketOptions.StartTls)
                : MailKit.Security.SecureSocketOptions.Auto;
            await client.ConnectAsync(_smtp.Host, _smtp.Port, sslOptions, cancellationToken);

            if (!string.IsNullOrWhiteSpace(_smtp.Username))
                await client.AuthenticateAsync(_smtp.Username, _smtp.Password, cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }

    private static string BuildConfirmationHtml(string userName, string confirmationLink)
    {
        return $$"""
                 <!DOCTYPE html>
                 <html>
                 <head>
                     <meta charset="utf-8"/>
                     <style>
                         body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
                         .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
                         .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center; }
                         .header h1 { color: #fff; margin: 0; font-size: 24px; }
                         .body { padding: 32px 24px; }
                         .body p { color: #374151; font-size: 15px; line-height: 1.6; }
                         .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 20px 0; }
                         .footer { padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px; }
                     </style>
                 </head>
                 <body>
                     <div class="container">
                         <div class="header">
                             <h1>✉️ Email Confirmation</h1>
                         </div>
                         <div class="body">
                             <p>Hi <strong>{{userName}}</strong>,</p>
                             <p>Thanks for registering! Please confirm your email address by clicking the button below:</p>
                             <p style="text-align:center;">
                                 <a href="{{confirmationLink}}" class="btn">Confirm Email</a>
                             </p>
                             <p>Or copy and paste this link into your browser:</p>
                             <p style="word-break:break-all; color:#6366f1; font-size:13px;">{{confirmationLink}}</p>
                             <p>If you did not create an account, you can safely ignore this email.</p>
                         </div>
                         <div class="footer">
                             &copy; ChildMotivation App
                         </div>
                     </div>
                 </body>
                 </html>
                 """;
    }
}
