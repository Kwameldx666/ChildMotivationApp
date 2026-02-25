using AuthService.Application.Enums;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IExternalAuthProviderFactory
{
    IExternalAuthProvider GetProvider(ExternalProviderType providerType);
}