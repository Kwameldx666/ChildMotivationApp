using System.Text.Json;
using System.Text.Json.Serialization;

namespace Gateway.Contracts.Ai;

/// <summary>
/// Request to execute an AI-suggested action
/// </summary>
public sealed class ExecuteAiActionRequest
{
    /// <summary>The action to execute</summary>
    public required AiActionDto Action { get; init; }
    
    /// <summary>User ID performing the action</summary>
    public string? UserId { get; init; }
    
    /// <summary>Family ID context</summary>
    public string? FamilyId { get; init; }
}

/// <summary>
/// AI action DTO from frontend
/// </summary>
public sealed class AiActionDto
{
    public required string Type { get; init; }
    public required string Label { get; init; }
    public string? Description { get; init; }
    public string Variant { get; init; } = "primary";
    public int Priority { get; init; }
    public JsonElement? Payload { get; init; }
}

/// <summary>
/// Response after executing an AI action
/// </summary>
public sealed class ExecuteAiActionResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public object? Data { get; init; }
}
