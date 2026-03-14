using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace AiService.Application.Contracts;

/// <summary>
/// Type of action that AI can suggest to the user
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AiActionType
{
    /// <summary>Create a new task</summary>
    CreateTask,
    
    /// <summary>Create multiple tasks</summary>
    CreateTasks,
    
    /// <summary>Create a reward</summary>
    CreateReward,
    
    /// <summary>Create multiple rewards</summary>
    CreateRewards,
    
    /// <summary>Update an existing task</summary>
    UpdateTask,
    
    /// <summary>Complete a task</summary>
    CompleteTask,
    
    /// <summary>Send a message to family chat</summary>
    SendFamilyMessage,
    
    /// <summary>Show analytics</summary>
    ShowAnalytics,
    
    /// <summary>Navigate to a page</summary>
    Navigate
}

/// <summary>
/// Action that AI suggests to perform
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record AiAction
{
    /// <summary>Action type</summary>
    public AiActionType Type { get; init; }
    
    /// <summary>Action name for display to user</summary>
    public string Label { get; init; } = string.Empty;
    
    /// <summary>Brief description of what will happen</summary>
    public string? Description { get; init; }
    
    /// <summary>
    /// Data for action execution (JSON payload)
    /// Structure depends on Type
    /// </summary>
    public object? Payload { get; init; }
    
    /// <summary>Action priority (for sorting)</summary>
    public int Priority { get; init; }
    
    /// <summary>Button style: primary, secondary, destructive</summary>
    public string Variant { get; init; } = "primary";
}

/// <summary>
/// Payload for CreateTask action
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record CreateTaskPayload
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int? Difficulty { get; init; }
    public int? RewardXp { get; init; }
    public int? RewardPoints { get; init; }
    public string? Category { get; init; }
    public IReadOnlyCollection<string>? Tags { get; init; }
}

/// <summary>
/// Payload for CreateTasks action (batch creation)
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record CreateTasksPayload
{
    public IReadOnlyCollection<CreateTaskPayload> Tasks { get; init; } = Array.Empty<CreateTaskPayload>();
}

/// <summary>
/// Payload for CreateRewards action (batch creation)
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record CreateRewardPayload
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int Cost { get; init; }
    public string? Category { get; init; }
    public string? Icon { get; init; }
}

/// <summary>
/// Payload for CreateRewards action (batch creation)
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record CreateRewardsPayload
{
    public IReadOnlyCollection<CreateRewardPayload> Rewards { get; init; } = Array.Empty<CreateRewardPayload>();
}

/// <summary>
/// Payload for Navigate action
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record NavigatePayload
{
    public string Route { get; init; } = string.Empty;
    public IReadOnlyDictionary<string, string>? QueryParams { get; init; }
}

/// <summary>
/// Payload for SendFamilyMessage action
/// </summary>
[ExcludeFromCodeCoverage]
public sealed record SendFamilyMessagePayload
{
    public string Message { get; init; } = string.Empty;
}



