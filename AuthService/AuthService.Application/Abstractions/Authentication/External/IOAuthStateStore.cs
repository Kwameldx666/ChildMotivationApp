using AuthService.Application.Enums;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IOAuthStateStore
{
    Task<string> CreateStateAsync(ExternalProviderType provider, CancellationToken cancellationToken);
    Task<bool> ValidateStateAsync(ExternalProviderType provider, string state, CancellationToken cancellationToken);
}