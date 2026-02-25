using System.Text.Json;

namespace Gateway.Contracts.Ai;

/// <summary>
///     AI action DTO from frontend
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