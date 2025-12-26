namespace AuthService.Application.Abstractions.Infrastructure;

public interface IGoogleStateStore
{
    Task<string> CreateStateAsync(CancellationToken cancellationToken);
    Task<bool> ValidateStateAsync(string state, CancellationToken cancellationToken);
}