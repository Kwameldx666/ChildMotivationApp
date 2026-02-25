namespace Gateway.Infrastructure.Options;

public class ServiceOptions
{
    public required string BaseUrl { get; init; }
    public int TimeoutSeconds { get; init; } = 30;
    public int MaxRetries { get; init; } = 3;
}