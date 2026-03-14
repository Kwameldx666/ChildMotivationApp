using System.Diagnostics.CodeAnalysis;
namespace Gateway.Contracts.Ai;

/// <summary>
///     Response after executing an AI action
/// </summary>
[ExcludeFromCodeCoverage]
public sealed class ExecuteAiActionResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public object? Data { get; init; }
}

