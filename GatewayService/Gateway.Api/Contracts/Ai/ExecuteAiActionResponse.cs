namespace Gateway.Contracts.Ai;

/// <summary>
///     Response after executing an AI action
/// </summary>
public sealed class ExecuteAiActionResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public object? Data { get; init; }
}