namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

/// <summary>
/// Generates realistic mock analytics data for development/demo purposes.
/// Builds a single pool of 90-day individual tasks (cached per day),
/// then slices / aggregates for any requested windowDays.
/// This guarantees 7-day ⊂ 30-day ⊂ 90-day totals are always consistent.
/// Each child has unique difficulty preferences, task frequency & completion rate.
/// </summary>
public static class AnalyticsMockDataProvider
{
    // ── Child profiles ──────────────────────────────────────────────
    private static readonly string[] ChildNames  = ["Алиса", "Максим", "София", "Артём"];
    private static readonly string[] ChildColors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"];

    // Difficulty preference weights per child (very-easy … very-hard)
    private static readonly int[][] DifficultyProfiles =
    [
        [30, 35, 20, 10,  5],  // Алиса  — предпочитает лёгкие
        [ 5, 15, 30, 30, 20],  // Максим — берётся за сложные
        [10, 20, 40, 20, 10],  // София  — сбалансированная
        [20, 25, 25, 20, 10],  // Артём  — чуть легче среднего
    ];

    // Avg tasks/day per child (varied activity levels)
    private static readonly double[] TasksPerDay = [2.2, 3.0, 1.6, 2.5];

    // Base completion rate per child (before time-improvement)
    private static readonly double[] BaseCompletionRate = [0.78, 0.62, 0.85, 0.70];

    private static readonly int[] PointsPerDifficulty = [5, 10, 18, 28, 42];

    private static readonly (string Name, string Color)[] DifficultyLevels =
    [
        ("Очень легко",  "#22c55e"),
        ("Легко",        "#84cc16"),
        ("Средне",       "#eab308"),
        ("Сложно",       "#f97316"),
        ("Очень сложно", "#ef4444"),
    ];

    private const int MaxDays = 90;
    private const int NumChildren = 4;

    // ── Cached raw task pool ────────────────────────────────────────
    private static List<MockTask>? _cache;
    private static DateTime _cacheDate;
    private static readonly object Lock = new();

    private sealed record MockTask(
        int   ChildIndex,
        DateTime CreatedAt,
        DateTime? CompletedAt,
        int   Difficulty,   // 0-4
        int   RewardPoints,
        bool  Completed
    );

    /// <summary>
    /// Generate (or return cached) pool of individual mock tasks for 90 days.
    /// Seed is derived from today's date → stable within a day, changes daily.
    /// </summary>
    private static List<MockTask> GetTaskPool()
    {
        var today = DateTime.UtcNow.Date;

        lock (Lock)
        {
            if (_cache is not null && _cacheDate == today)
                return _cache;

            var seed = today.Year * 10000 + today.Month * 100 + today.Day;
            var rng  = new Random(seed);
            var pool = new List<MockTask>(MaxDays * NumChildren * 4);

            for (var childIdx = 0; childIdx < NumChildren; childIdx++)
            {
                var profile     = DifficultyProfiles[childIdx];
                var totalWeight = profile.Sum();
                var avgPerDay   = TasksPerDay[childIdx];
                var baseRate    = BaseCompletionRate[childIdx];

                for (var dayOffset = MaxDays - 1; dayOffset >= 0; dayOffset--)
                {
                    var date = today.AddDays(-dayOffset);

                    // Weekend = fewer tasks
                    var isWeekend = date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
                    var dayAvg = isWeekend ? avgPerDay * 0.5 : avgPerDay;

                    var tasksToday = Math.Max(0,
                        (int)Math.Round(dayAvg * (0.5 + rng.NextDouble())));

                    // Completion improves over the 90-day window
                    var dayProgress    = (double)(MaxDays - dayOffset) / MaxDays;
                    var completionRate = Math.Min(0.95, baseRate + dayProgress * 0.12);

                    for (var t = 0; t < tasksToday; t++)
                    {
                        // Pick difficulty from child's profile
                        var roll      = rng.Next(totalWeight);
                        var difficulty = 0;
                        var cum       = 0;
                        for (var d = 0; d < 5; d++)
                        {
                            cum += profile[d];
                            if (roll < cum) { difficulty = d; break; }
                        }

                        // Harder tasks → slightly less likely to be completed
                        var completed = rng.NextDouble() < completionRate;
                        if (difficulty >= 3 && rng.NextDouble() < 0.12) completed = false;
                        if (difficulty == 4 && rng.NextDouble() < 0.10) completed = false;

                        var pts = PointsPerDifficulty[difficulty] + rng.Next(-2, 4);
                        if (pts < 1) pts = 1;

                        var createdAt   = date.AddHours(rng.Next(8, 20)).AddMinutes(rng.Next(60));
                        var completedAt = completed
                            ? createdAt.AddHours(rng.Next(1, 6)).AddMinutes(rng.Next(60))
                            : (DateTime?)null;

                        pool.Add(new MockTask(childIdx, createdAt, completedAt, difficulty, pts, completed));
                    }
                }
            }

            _cache     = pool;
            _cacheDate = today;
            return pool;
        }
    }

    // ── Public entry point ──────────────────────────────────────────
    public static AnalyticsDto Generate(int windowDays)
    {
        // Clamp to 90 max
        windowDays = Math.Clamp(windowDays, 1, MaxDays);

        var allTasks = GetTaskPool();
        var cutoff   = DateTime.UtcNow.AddDays(-windowDays);
        var tasks    = allTasks.Where(t => t.CreatedAt >= cutoff).ToList();

        var now                 = DateTime.UtcNow;
        var useDailyGranularity = windowDays <= 14;
        var buckets             = useDailyGranularity ? windowDays : (int)Math.Ceiling(windowDays / 7.0);

        // ── Overall stats ───────────────────────────────────────────
        var totalCompleted  = tasks.Count(t => t.Completed);
        var totalTaskCount  = tasks.Count;
        var totalPoints     = tasks.Where(t => t.Completed).Sum(t => t.RewardPoints);
        var completionRate  = totalTaskCount > 0 ? (double)totalCompleted / totalTaskCount * 100 : 0;
        var overdue         = tasks.Count(t => !t.Completed && t.CreatedAt < now.AddDays(-7));
        var pending         = tasks.Count(t => !t.Completed) - overdue;
        if (pending < 0) pending = 0;

        // ── 1. Weekly Activity (tasks completed + points per bucket) ─
        var weeklyActivity = BuildBucketData(tasks, now, useDailyGranularity, buckets,
            bucket => new DailyActivityDto(
                bucket.Label,
                bucket.Tasks.Count(t => t.Completed),
                bucket.Tasks.Where(t => t.Completed).Sum(t => t.RewardPoints)));

        // ── 2. Children Stats ───────────────────────────────────────
        var childrenStats = Enumerable.Range(0, NumChildren).Select(i =>
        {
            var ct = tasks.Where(t => t.ChildIndex == i).ToList();
            return new ChildStatsDto(
                $"child-{i:D4}",
                ChildNames[i],
                ct.Where(t => t.Completed).Sum(t => t.RewardPoints),
                ct.Count(t => t.Completed),
                ct.Count(t => !t.Completed),
                ChildColors[i]);
        }).OrderByDescending(c => c.TotalPoints).ToList();

        // ── 3. Difficulty Distribution (from real task data) ────────
        var difficultyDistribution = Enumerable.Range(0, 5)
            .Select(d => new CategoryDataDto(
                DifficultyLevels[d].Name,
                tasks.Count(t => t.Difficulty == d),
                DifficultyLevels[d].Color))
            .Where(d => d.Value > 0)
            .ToList();

        // ── 4. Weekly Progress (completed vs total per bucket) ──────
        var weeklyProgress = BuildBucketData(tasks, now, useDailyGranularity, buckets,
            bucket => new WeeklyProgressDto(
                bucket.Label,
                bucket.Tasks.Count(t => t.Completed),
                bucket.Tasks.Count));

        // ── 5. Task Status ──────────────────────────────────────────
        var taskStatus = new TaskStatusDto(totalCompleted, pending, overdue);

        // ── 6. Points Trend (cumulative) ────────────────────────────
        var pointsTrend = BuildPointsTrend(tasks, now, useDailyGranularity, buckets);

        // ── 7. Per-child breakdowns ─────────────────────────────────
        var childIds = childrenStats.Select(c => c.ChildId).ToList();

        var perChildActivity = childIds.Select((cid, idx) =>
        {
            var ct = tasks.Where(t => t.ChildIndex == idx).ToList();
            return new ChildBreakdownDto<DailyActivityDto>(cid,
                BuildBucketData(ct, now, useDailyGranularity, buckets,
                    b => new DailyActivityDto(b.Label,
                        b.Tasks.Count(t => t.Completed),
                        b.Tasks.Where(t => t.Completed).Sum(t => t.RewardPoints))));
        }).ToList();

        var perChildDifficulty = childIds.Select((cid, idx) =>
        {
            var ct = tasks.Where(t => t.ChildIndex == idx).ToList();
            return new ChildBreakdownDto<CategoryDataDto>(cid,
                Enumerable.Range(0, 5)
                    .Select(d => new CategoryDataDto(
                        DifficultyLevels[d].Name,
                        ct.Count(t => t.Difficulty == d),
                        DifficultyLevels[d].Color))
                    .Where(d => d.Value > 0)
                    .ToList());
        }).ToList();

        var perChildProgress = childIds.Select((cid, idx) =>
        {
            var ct = tasks.Where(t => t.ChildIndex == idx).ToList();
            return new ChildBreakdownDto<WeeklyProgressDto>(cid,
                BuildBucketData(ct, now, useDailyGranularity, buckets,
                    b => new WeeklyProgressDto(b.Label,
                        b.Tasks.Count(t => t.Completed),
                        b.Tasks.Count)));
        }).ToList();

        var perChildPointsTrend = childIds.Select((cid, idx) =>
        {
            var ct = tasks.Where(t => t.ChildIndex == idx).ToList();
            return new ChildBreakdownDto<PointsTrendDto>(cid,
                BuildPointsTrend(ct, now, useDailyGranularity, buckets));
        }).ToList();

        return new AnalyticsDto(
            totalPoints, totalCompleted, totalTaskCount, NumChildren,
            Math.Round(completionRate, 1),
            weeklyActivity, childrenStats, difficultyDistribution,
            weeklyProgress, taskStatus, pointsTrend,
            perChildActivity, perChildDifficulty,
            perChildProgress, perChildPointsTrend);
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private sealed record BucketInfo(string Label, List<MockTask> Tasks);

    private static List<T> BuildBucketData<T>(
        List<MockTask> tasks,
        DateTime now,
        bool daily,
        int buckets,
        Func<BucketInfo, T> selector)
    {
        var result = new List<T>(buckets);
        for (var i = 0; i < buckets; i++)
        {
            DateTime bucketStart, bucketEnd;
            if (daily)
            {
                bucketStart = now.Date.AddDays(-(buckets - 1 - i));
                bucketEnd   = bucketStart.AddDays(1);
            }
            else
            {
                bucketEnd   = now.Date.AddDays(-(buckets - 1 - i) * 7 + 7);
                bucketStart = bucketEnd.AddDays(-7);
            }

            var bucketTasks = tasks
                .Where(t => t.CreatedAt >= bucketStart && t.CreatedAt < bucketEnd)
                .ToList();

            var label = bucketStart.ToString("dd MMM");
            result.Add(selector(new BucketInfo(label, bucketTasks)));
        }
        return result;
    }

    private static List<PointsTrendDto> BuildPointsTrend(
        List<MockTask> tasks,
        DateTime now,
        bool daily,
        int buckets)
    {
        var result     = new List<PointsTrendDto>(buckets);
        var cumulative = 0;

        for (var i = 0; i < buckets; i++)
        {
            DateTime bucketStart, bucketEnd;
            if (daily)
            {
                bucketStart = now.Date.AddDays(-(buckets - 1 - i));
                bucketEnd   = bucketStart.AddDays(1);
            }
            else
            {
                bucketEnd   = now.Date.AddDays(-(buckets - 1 - i) * 7 + 7);
                bucketStart = bucketEnd.AddDays(-7);
            }

            cumulative += tasks
                .Where(t => t.Completed
                             && t.CompletedAt.HasValue
                             && t.CompletedAt.Value >= bucketStart
                             && t.CompletedAt.Value < bucketEnd)
                .Sum(t => t.RewardPoints);

            result.Add(new PointsTrendDto(bucketStart.ToString("dd MMM"), cumulative));
        }

        return result;
    }
}
