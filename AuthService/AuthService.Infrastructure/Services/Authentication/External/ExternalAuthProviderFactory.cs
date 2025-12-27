using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Infrastructure.Services.Authentication.External;

using Microsoft.Extensions.Logging;

public class ExternalAuthProviderFactory : IExternalAuthProviderFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExternalAuthProviderFactory> _logger;

    public ExternalAuthProviderFactory(IServiceProvider serviceProvider, ILogger<ExternalAuthProviderFactory> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _logger.LogInformation("ExternalAuthProviderFactory created");
    }

    public IExternalAuthProvider GetProvider(ExternalProviderType providerType)
    {
        _logger.LogInformation("Resolving external auth provider for {ProviderType}", providerType);
        return providerType switch
        {
            ExternalProviderType.Google => _serviceProvider.GetRequiredService<GoogleAuthProvider>(),
            ExternalProviderType.GitHub => _serviceProvider.GetRequiredService<GitHubAuthProvider>(),
            _ => throw new NotSupportedException($"External provider '{providerType}' is not supported.")
        };
    }
}
