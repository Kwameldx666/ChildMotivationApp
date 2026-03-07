namespace Gateway.Contracts.Ai;

/// <summary>
///     Request to execute an AI-suggested action
/// </summary>
public sealed class ExecuteAiActionRequest
{
    /// <summary>The action to execute</summary>
    public required AiActionDto Action { get; init; }

    /// <summary>User ID performing the action</summary>
    public string? UserId { get; init; }

    /// <summary>Family ID context</summary>
    public string? FamilyId { get; init; }

    /// <summary>Preferred language (e.g. "ru", "en"). Defaults to Russian.</summary>
    public string? Language { get; init; }
}