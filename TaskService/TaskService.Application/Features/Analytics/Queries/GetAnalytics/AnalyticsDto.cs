namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public sealed record AnalyticsDto(
    // Overall statistics
    int TotalPoints,
    int CompletedTasks,
    int TotalTasks,
    int ActiveChildren,
    double CompletionRate,
    
    // Activity by day of week (aggregated)
    IReadOnlyList<DailyActivityDto> WeeklyActivity,
    
    // Statistics by children
    IReadOnlyList<ChildStatsDto> ChildrenStats,
    
    // Tasks by category/difficulty (aggregated)
    IReadOnlyList<CategoryDataDto> DifficultyDistribution,
    
    // Progress by week (aggregated)
    IReadOnlyList<WeeklyProgressDto> WeeklyProgress,
    
    // Task status (aggregated)
    TaskStatusDto TaskStatus,
    
    // Points trend (aggregated)
    IReadOnlyList<PointsTrendDto> PointsTrend,
    
    // ── Per-child breakdowns ──
    IReadOnlyList<ChildBreakdownDto<DailyActivityDto>> PerChildActivity,
    IReadOnlyList<ChildBreakdownDto<CategoryDataDto>> PerChildDifficulty,
    IReadOnlyList<ChildBreakdownDto<WeeklyProgressDto>> PerChildProgress,
    IReadOnlyList<ChildBreakdownDto<PointsTrendDto>> PerChildPointsTrend
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

/// <summary>Per-child wrapper — holds child identifier + array of chart data.</summary>
public sealed record ChildBreakdownDto<T>(
    string ChildId,
    IReadOnlyList<T> Data
);
