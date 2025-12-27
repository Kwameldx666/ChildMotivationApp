namespace AuthService.Application.Abstractions.Authentication.External;

public interface IOAuthStateStore
{
    Task<string> CreateStateAsync(CancellationToken cancellationToken);
    Task<bool> ValidateStateAsync(string state, CancellationToken cancellationToken);
}