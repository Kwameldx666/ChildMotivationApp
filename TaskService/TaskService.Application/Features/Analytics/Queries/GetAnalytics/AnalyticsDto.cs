namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public sealed record AnalyticsDto(
    // Общая статистика
    int TotalPoints,
    int CompletedTasks,
    int TotalTasks,
    int ActiveChildren,
    double CompletionRate,
    
    // Активность по дням недели
    IReadOnlyList<DailyActivityDto> WeeklyActivity,
    
    // Статистика по детям
    IReadOnlyList<ChildStatsDto> ChildrenStats,
    
    // Задачи по категориям (на основе сложности)
    IReadOnlyList<CategoryDataDto> DifficultyDistribution,
    
    // Прогресс по неделям
    IReadOnlyList<WeeklyProgressDto> WeeklyProgress,
    
    // Статус задач
    TaskStatusDto TaskStatus,
    
    // Тренд очков
    IReadOnlyList<PointsTrendDto> PointsTrend
);

public sealed record DailyActivityDto(
    string Day,
    int TasksCompleted,
    int PointsEarned
);

public sealed record ChildStatsDto(
    string ChildId,
    string ChildName,
    int TotalPoints,
    int CompletedTasks,
    int PendingTasks,
    string Color
);

public sealed record CategoryDataDto(
    string Name,
    int Value,
    string Color
);

public sealed record WeeklyProgressDto(
    string Week,
    int Completed,
    int Total
);

public sealed record TaskStatusDto(
    int Completed,
    int InProgress,
    int Overdue
);

public sealed record PointsTrendDto(
    string Date,
    int Points
);
