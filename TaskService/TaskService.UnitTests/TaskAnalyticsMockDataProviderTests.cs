using TaskService.Application.Features.Analytics.Queries.GetAnalytics;

namespace UnitTests;

public sealed class TaskAnalyticsMockDataProviderTests
{
    [Fact]
    public void Generate_ShouldReturnDailyBuckets_ForShortWindow()
    {
        var analytics = AnalyticsMockDataProvider.Generate(7);

        Assert.Equal(7, analytics.WeeklyActivity.Count);
        Assert.Equal(7, analytics.WeeklyProgress.Count);
        Assert.Equal(7, analytics.PointsTrend.Count);
        Assert.Equal(4, analytics.ChildrenStats.Count);
        Assert.True(analytics.TotalTasks >= analytics.CompletedTasks);
        Assert.InRange(analytics.CompletionRate, 0, 100);
    }

    [Fact]
    public void Generate_ShouldClampWindowToMax90Days()
    {
        var analytics = AnalyticsMockDataProvider.Generate(365);

        // For 90-day window provider uses weekly aggregation: ceil(90 / 7) = 13 buckets.
        Assert.Equal(13, analytics.WeeklyActivity.Count);
        Assert.Equal(13, analytics.WeeklyProgress.Count);
        Assert.Equal(13, analytics.PointsTrend.Count);
    }

    [Fact]
    public void Generate_ShouldProduceMonotonicPointsTrend()
    {
        var analytics = AnalyticsMockDataProvider.Generate(30);
        var points = analytics.PointsTrend.Select(x => x.Points).ToArray();

        for (var i = 1; i < points.Length; i++)
        {
            Assert.True(points[i] >= points[i - 1]);
        }
    }
}
