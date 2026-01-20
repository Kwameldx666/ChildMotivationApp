using MediatR;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public sealed class GetAnalyticsQueryHandler(ITaskRepository taskRepository)
    : IRequestHandler<GetAnalyticsQuery, AnalyticsDto>
{
    public async Task<AnalyticsDto> Handle(GetAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-request.WindowDays);
        
        // Получаем все задачи пользователя
        var allTasks = await taskRepository.GetAsync(request.UserId, null, cancellationToken);
        var recentTasks = allTasks.Where(t => t.CreatedAt >= cutoffDate).ToList();
        
        // Общая статистика
        var completedTasks = recentTasks.Count(t => t.Completed);
        var totalTasks = recentTasks.Count;
        var totalPoints = recentTasks.Where(t => t.Completed).Sum(t => t.RewardPoints);
        var completionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;
        
        // Получаем уникальных детей
        var activeChildren = recentTasks
            .Where(t => !string.IsNullOrEmpty(t.AssignedToUserId))
            .Select(t => t.AssignedToUserId)
            .Distinct()
            .Count();
        
        // Активность по дням недели
        var weeklyActivity = BuildWeeklyActivity(recentTasks);
        
        // Статистика по детям
        var childrenStats = BuildChildrenStats(recentTasks);
        
        // Распределение по сложности
        var difficultyDistribution = BuildDifficultyDistribution(recentTasks);
        
        // Прогресс по неделям
        var weeklyProgress = BuildWeeklyProgress(recentTasks);
        
        // Статус задач
        var taskStatus = BuildTaskStatus(recentTasks);
        
        // Тренд очков
        var pointsTrend = BuildPointsTrend(recentTasks);
        
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
    
    private static List<DailyActivityDto> BuildWeeklyActivity(List<Domain.Entities.TaskItem> tasks)
    {
        var dayNames = new[] { "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс" };
        var lastWeek = DateTime.UtcNow.AddDays(-7);
        
        return Enumerable.Range(0, 7).Select(i =>
        {
            var date = lastWeek.AddDays(i);
            var dayOfWeek = (int)date.DayOfWeek;
            var dayName = dayNames[dayOfWeek == 0 ? 6 : dayOfWeek - 1]; // Monday = 0
            
            var dayTasks = tasks.Where(t => 
                t.CompletedAt.HasValue && 
                t.CompletedAt.Value.Date == date.Date
            ).ToList();
            
            return new DailyActivityDto(
                dayName,
                dayTasks.Count,
                dayTasks.Sum(t => t.RewardPoints)
            );
        }).ToList();
    }
    
    private static List<ChildStatsDto> BuildChildrenStats(List<Domain.Entities.TaskItem> tasks)
    {
        var colors = new[] { "#f59e0b", "#8b5cf6", "#ec4899", "#10b981", "#3b82f6" };
        
        var groupedByChild = tasks
            .Where(t => !string.IsNullOrEmpty(t.AssignedToUserId))
            .GroupBy(t => t.AssignedToUserId)
            .Select((g, index) => new ChildStatsDto(
                g.Key ?? "",
                GetChildName(g.Key ?? ""), // Можно улучшить, получив реальное имя из UserService
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
        // TODO: Получать реальное имя из UserService через HTTP клиент
        // Пока используем часть ID
        return $"Ребенок {userId[^4..]}";
    }
    
    private static List<CategoryDataDto> BuildDifficultyDistribution(List<Domain.Entities.TaskItem> tasks)
    {
        var colors = new Dictionary<int, (string Name, string Color)>
        {
            { 1, ("Очень легко", "#10b981") },
            { 2, ("Легко", "#3b82f6") },
            { 3, ("Средне", "#f59e0b") },
            { 4, ("Сложно", "#ef4444") },
            { 5, ("Очень сложно", "#991b1b") }
        };
        
        return tasks
            .GroupBy(t => t.Difficulty)
            .Select(g => new CategoryDataDto(
                colors.TryGetValue(g.Key, out var info) ? info.Name : $"Уровень {g.Key}",
                g.Count(),
                colors.TryGetValue(g.Key, out var color) ? color.Color : "#6b7280"
            ))
            .OrderBy(c => c.Name)
            .ToList();
    }
    
    private static List<WeeklyProgressDto> BuildWeeklyProgress(List<Domain.Entities.TaskItem> tasks)
    {
        var weeks = new List<WeeklyProgressDto>();
        var now = DateTime.UtcNow;
        
        for (int i = 3; i >= 0; i--)
        {
            var weekStart = now.AddDays(-7 * (i + 1));
            var weekEnd = now.AddDays(-7 * i);
            
            var weekTasks = tasks.Where(t => 
                t.CreatedAt >= weekStart && 
                t.CreatedAt < weekEnd
            ).ToList();
            
            weeks.Add(new WeeklyProgressDto(
                $"Нед {4 - i}",
                weekTasks.Count(t => t.Completed),
                weekTasks.Count
            ));
        }
        
        return weeks;
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
        // Задача считается просроченной, если создана более 7 дней назад и не завершена
        return !task.Completed && 
               task.CreatedAt < DateTime.UtcNow.AddDays(-7);
    }
    
    private static List<PointsTrendDto> BuildPointsTrend(List<Domain.Entities.TaskItem> tasks)
    {
        var weeks = new List<PointsTrendDto>();
        var now = DateTime.UtcNow;
        
        for (int i = 4; i >= 0; i--)
        {
            var weekEnd = now.AddDays(-7 * i);
            var allTasksUntilThen = tasks.Where(t => 
                t.Completed && 
                t.CompletedAt <= weekEnd
            );
            
            var cumulativePoints = allTasksUntilThen.Sum(t => t.RewardPoints);
            
            weeks.Add(new PointsTrendDto(
                weekEnd.ToString("dd MMM"),
                cumulativePoints
            ));
        }
        
        return weeks;
    }
}
