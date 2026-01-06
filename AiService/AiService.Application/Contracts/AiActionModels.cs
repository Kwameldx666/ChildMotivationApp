using System.Text.Json.Serialization;

namespace AiService.Application.Contracts;

/// <summary>
/// Тип действия, которое AI может предложить пользователю выполнить
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AiActionType
{
    /// <summary>Создать новую задачу</summary>
    CreateTask,
    
    /// <summary>Создать несколько задач</summary>
    CreateTasks,
    
    /// <summary>Создать награду</summary>
    CreateReward,
    
    /// <summary>Создать несколько наград</summary>
    CreateRewards,
    
    /// <summary>Обновить существующую задачу</summary>
    UpdateTask,
    
    /// <summary>Завершить задачу</summary>
    CompleteTask,
    
    /// <summary>Отправить сообщение в семейный чат</summary>
    SendFamilyMessage,
    
    /// <summary>Показать аналитику</summary>
    ShowAnalytics,
    
    /// <summary>Перейти на страницу</summary>
    Navigate
}

/// <summary>
/// Действие, которое AI предлагает выполнить
/// </summary>
public sealed record AiAction
{
    /// <summary>Тип действия</summary>
    public AiActionType Type { get; init; }
    
    /// <summary>Название действия для отображения пользователю</summary>
    public string Label { get; init; } = string.Empty;
    
    /// <summary>Краткое описание что произойдёт</summary>
    public string? Description { get; init; }
    
    /// <summary>
    /// Данные для выполнения действия (JSON payload)
    /// Структура зависит от Type
    /// </summary>
    public object? Payload { get; init; }
    
    /// <summary>Приоритет действия (для сортировки)</summary>
    public int Priority { get; init; }
    
    /// <summary>Стиль кнопки: primary, secondary, destructive</summary>
    public string Variant { get; init; } = "primary";
}

/// <summary>
/// Payload для CreateTask action
/// </summary>
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
/// Payload для CreateTasks action (множественное создание)
/// </summary>
public sealed record CreateTasksPayload
{
    public IReadOnlyCollection<CreateTaskPayload> Tasks { get; init; } = Array.Empty<CreateTaskPayload>();
}

/// <summary>
/// Payload для CreateReward action
/// </summary>
public sealed record CreateRewardPayload
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int Cost { get; init; }
    public string? Category { get; init; }
    public string? Icon { get; init; }
}

/// <summary>
/// Payload для CreateRewards action (множественное создание)
/// </summary>
public sealed record CreateRewardsPayload
{
    public IReadOnlyCollection<CreateRewardPayload> Rewards { get; init; } = Array.Empty<CreateRewardPayload>();
}

/// <summary>
/// Payload для Navigate action
/// </summary>
public sealed record NavigatePayload
{
    public string Route { get; init; } = string.Empty;
    public IReadOnlyDictionary<string, string>? QueryParams { get; init; }
}

/// <summary>
/// Payload для SendFamilyMessage action
/// </summary>
public sealed record SendFamilyMessagePayload
{
    public string Message { get; init; } = string.Empty;
}
