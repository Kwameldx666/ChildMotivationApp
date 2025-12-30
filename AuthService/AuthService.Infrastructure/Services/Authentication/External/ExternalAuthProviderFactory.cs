using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Infrastructure.Services.Authentication.External;

public class ExternalAuthProviderFactory : IExternalAuthProviderFactory
{
    private readonly IServiceProvider _serviceProvider;

    public ExternalAuthProviderFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IExternalAuthProvider GetProvider(ExternalProviderType providerType)
    {
        // Resolve scoped providers inside a scope so factory can be singleton-safe
        using var scope = _serviceProvider.CreateScope();
        var providers = scope.ServiceProvider.GetServices<IExternalAuthProvider>();
        var provider = providers.FirstOrDefault(p => p.ProviderType == providerType);
        if (provider == null)
            throw new InvalidOperationException($"Provider {providerType} not registered.");
        return provider;
    }
}