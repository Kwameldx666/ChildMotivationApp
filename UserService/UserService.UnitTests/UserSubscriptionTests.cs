using UserService.Domain.Entities;
using UserService.Domain.Enums;

namespace UnitTests;

public sealed class UserSubscriptionTests
{
    [Fact]
    public void IsActive_ShouldReturnTrue_ForActiveSubscriptionWithoutEndDate()
    {
        var subscription = new UserSubscription
        {
            Status = SubscriptionStatus.Active,
            EndDate = null
        };

        Assert.True(subscription.IsActive());
    }

    [Fact]
    public void IsActive_ShouldReturnFalse_ForExpiredSubscription()
    {
        var subscription = new UserSubscription
        {
            Status = SubscriptionStatus.Active,
            EndDate = DateTime.UtcNow.AddMinutes(-1)
        };

        Assert.False(subscription.IsActive());
    }

    [Fact]
    public void HasFeature_ShouldRespectSubscriptionStateAndFlags()
    {
        var inactive = new UserSubscription
        {
            Status = SubscriptionStatus.Cancelled,
            HasAIAssistant = true
        };

        var active = new UserSubscription
        {
            Status = SubscriptionStatus.Active,
            EndDate = DateTime.UtcNow.AddDays(5),
            HasAIAssistant = true,
            HasAdvancedAnalytics = false
        };

        Assert.False(inactive.HasFeature("ai_assistant"));
        Assert.True(active.HasFeature("ai_assistant"));
        Assert.False(active.HasFeature("advanced_analytics"));
        Assert.False(active.HasFeature("unknown_feature"));
    }
}
