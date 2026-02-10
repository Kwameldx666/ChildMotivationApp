using MediatR;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public sealed class GetAnalyticsQueryHandler(ITaskRepository taskRepository)
    : IRequestHandler<GetAnalyticsQuery, AnalyticsDto>
{
    public async Task<AnalyticsDto> Handle(GetAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-request.WindowDays);
        
        // Get all tasks for the user
        var allTasks = await taskRepository.GetAsync(request.UserId, null, cancellationToken);
        var recentTasks = allTasks.Where(t => t.CreatedAt >= cutoffDate).ToList();
        
        // Overall statistics
        var completedTasks = recentTasks.Count(t => t.Completed);
        var totalTasks = recentTasks.Count;
        var totalPoints = recentTasks.Where(t => t.Completed).Sum(t => t.RewardPoints);
        var completionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;
        
        // Get unique children
        var activeChildren = recentTasks
            .Where(t => !string.IsNullOrEmpty(t.AssignedToUserId))
            .Select(t => t.AssignedToUserId)
            .Distinct()
            .Count();
        
        // Activity by day/week
        var weeklyActivity = BuildWeeklyActivity(recentTasks, request.WindowDays);
        
        // Statistics by children
        var childrenStats = BuildChildrenStats(recentTasks);
        
        // Distribution by difficulty
        var difficultyDistribution = BuildDifficultyDistribution(recentTasks);
        
        // Progress by week
        var weeklyProgress = BuildWeeklyProgress(recentTasks, request.WindowDays);
        
        // Task status
        var taskStatus = BuildTaskStatus(recentTasks);
        
        // Points trend
        var pointsTrend = BuildPointsTrend(recentTasks, request.WindowDays);
        
        return new AnalyticsDto(
            totalPoints,
            completedTasks,
            totalTasks,
            activeChildren,
            completionRate,
            weeklyActivity,
            childrenStats,
            difficultyDistribution,
            weeklyProgress,
            taskStatus,
            pointsTrend
        );
    }
    
    private static List<DailyActivityDto> BuildWeeklyActivity(List<Domain.Entities.TaskItem> tasks, int windowDays)
    {
        var entries = new List<DailyActivityDto>();
        var now = DateTime.UtcNow;

        if (windowDays <= 14)
        {
            // Daily granularity
            for (var i = windowDays - 1; i >= 0; i--)
            {
                var date = now.AddDays(-i);
                var dayTasks = tasks.Where(t =>
                    t.CompletedAt.HasValue &&
                    t.CompletedAt.Value.Date == date.Date
                ).ToList();

                entries.Add(new DailyActivityDto(
                    date.ToString("dd MMM"),
                    dayTasks.Count,
                    dayTasks.Sum(t => t.RewardPoints)
                ));
            }
        }
        else
        {
            // Weekly granularity
            var totalWeeks = (int)Math.Ceiling(windowDays / 7.0);
            for (var i = totalWeeks - 1; i >= 0; i--)
            {
                var weekEnd = now.AddDays(-7 * i);
                var weekStart = weekEnd.AddDays(-7);

                var weekTasks = tasks.Where(t =>
                    t.CompletedAt.HasValue &&
                    t.CompletedAt.Value >= weekStart &&
                    t.CompletedAt.Value < weekEnd
                ).ToList();

                entries.Add(new DailyActivityDto(
                    weekStart.ToString("dd MMM"),
                    weekTasks.Count,
                    weekTasks.Sum(t => t.RewardPoints)
                ));
            }
        }

        return entries;
    }
    
    private static List<ChildStatsDto> BuildChildrenStats(List<Domain.Entities.TaskItem> tasks)
    {
        var colors = new[] { "#f59e0b", "#8b5cf6", "#ec4899", "#10b981", "#3b82f6" };
        
        var groupedByChild = tasks
            .Where(t => !string.IsNullOrEmpty(t.AssignedToUserId))
            .GroupBy(t => t.AssignedToUserId)
            .Select((g, index) => new ChildStatsDto(
                g.Key ?? "",
                GetChildName(g.Key ?? ""), // Can be improved by getting the actual name from UserService
                g.Where(t => t.Completed).Sum(t => t.RewardPoints),
                g.Count(t => t.Completed),
                g.Count(t => !t.Completed),
                colors[index % colors.Length]
            ))
            .OrderByDescending(c => c.TotalPoints)
            .ToList();
        
        return groupedByChild;
    }
    
    private static string GetChildName(string userId)
    {
        // TODO: Get actual name from UserService via HTTP client
        // For now using part of ID
        return $"Child {userId[^4..]}";
    }
    
    private static List<CategoryDataDto> BuildDifficultyDistribution(List<Domain.Entities.TaskItem> tasks)
    {
        var colors = new Dictionary<int, (string Name, string Color)>
        {
            { 1, ("Very Easy", "#10b981") },
            { 2, ("Easy", "#3b82f6") },
            { 3, ("Medium", "#f59e0b") },
            { 4, ("Hard", "#ef4444") },
            { 5, ("Very Hard", "#991b1b") }
        };
        
        return tasks
            .GroupBy(t => t.Difficulty)
            .Select(g => new CategoryDataDto(
                colors.TryGetValue(g.Key, out var info) ? info.Name : $"Level {g.Key}",
                g.Count(),
                colors.TryGetValue(g.Key, out var color) ? color.Color : "#6b7280"
            ))
            .OrderBy(c => c.Name)
            .ToList();
    }
    
    private static List<WeeklyProgressDto> BuildWeeklyProgress(List<Domain.Entities.TaskItem> tasks, int windowDays)
    {
        var entries = new List<WeeklyProgressDto>();
        var now = DateTime.UtcNow;

        if (windowDays <= 14)
        {
            // Daily granularity for short windows
            for (var i = windowDays - 1; i >= 0; i--)
            {
                var date = now.AddDays(-i);
                var dayTasks = tasks.Where(t => t.CreatedAt.Date == date.Date).ToList();

                entries.Add(new WeeklyProgressDto(
                    date.ToString("dd MMM"),
                    dayTasks.Count(t => t.Completed),
                    dayTasks.Count
                ));
            }
        }
        else
        {
            // Weekly granularity
            var totalWeeks = (int)Math.Ceiling(windowDays / 7.0);
            for (var i = totalWeeks - 1; i >= 0; i--)
            {
                var weekEnd = now.AddDays(-7 * i);
                var weekStart = weekEnd.AddDays(-7);

                var weekTasks = tasks.Where(t =>
                    t.CreatedAt >= weekStart &&
                    t.CreatedAt < weekEnd
                ).ToList();

                entries.Add(new WeeklyProgressDto(
                    weekStart.ToString("dd MMM"),
                    weekTasks.Count(t => t.Completed),
                    weekTasks.Count
                ));
            }
        }

        return entries;
    }
    
    private static TaskStatusDto BuildTaskStatus(List<Domain.Entities.TaskItem> tasks)
    {
        var completed = tasks.Count(t => t.Completed);
        var inProgress = tasks.Count(t => !t.Completed && !IsOverdue(t));
        var overdue = tasks.Count(t => !t.Completed && IsOverdue(t));
        
        return new TaskStatusDto(completed, inProgress, overdue);
    }
    
    private static bool IsOverdue(Domain.Entities.TaskItem task)
    {
        // Task is considered overdue if created more than 7 days ago and not completed
        return !task.Completed && 
               task.CreatedAt < DateTime.UtcNow.AddDays(-7);
    }
    
    private static List<PointsTrendDto> BuildPointsTrend(List<Domain.Entities.TaskItem> tasks, int windowDays)
    {
        var entries = new List<PointsTrendDto>();
        var now = DateTime.UtcNow;

        if (windowDays <= 14)
        {
            // Daily granularity for short windows
            for (var i = windowDays - 1; i >= 0; i--)
            {
                var date = now.AddDays(-i);
                var cumulativePoints = tasks.Where(t =>
                    t.Completed &&
                    t.CompletedAt.HasValue &&
                    t.CompletedAt.Value.Date <= date.Date
                ).Sum(t => t.RewardPoints);

                entries.Add(new PointsTrendDto(
                    date.ToString("dd MMM"),
                    cumulativePoints
                ));
            }
        }
        else
        {
            // Weekly granularity
            var totalWeeks = (int)Math.Ceiling(windowDays / 7.0);
            for (var i = totalWeeks - 1; i >= 0; i--)
            {
                var weekEnd = now.AddDays(-7 * i);
                var cumulativePoints = tasks.Where(t =>
                    t.Completed &&
                    t.CompletedAt <= weekEnd
                ).Sum(t => t.RewardPoints);

                entries.Add(new PointsTrendDto(
                    weekEnd.ToString("dd MMM"),
                    cumulativePoints
                ));
            }
        }

        return entries;
    }
}
