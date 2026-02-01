namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public sealed record AnalyticsDto(
    // Overall statistics
    int TotalPoints,
    int CompletedTasks,
    int TotalTasks,
    int ActiveChildren,
    double CompletionRate,
    
    // Activity by day of week
    IReadOnlyList<DailyActivityDto> WeeklyActivity,
    
    // Statistics by children
    IReadOnlyList<ChildStatsDto> ChildrenStats,
    
    // Tasks by category (based on difficulty)
    IReadOnlyList<CategoryDataDto> DifficultyDistribution,
    
    // Progress by week
    IReadOnlyList<WeeklyProgressDto> WeeklyProgress,
    
    // Task status
    TaskStatusDto TaskStatus,
    
    // Points trend
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
