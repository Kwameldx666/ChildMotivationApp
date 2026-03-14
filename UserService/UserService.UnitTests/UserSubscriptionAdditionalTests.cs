using Moq;
using UserService.Application.Features.Subscription.GetSubscription;
using UserService.Application.Interfaces;
using UserService.Domain.Entities;
using UserService.Domain.Enums;

namespace UserService.UnitTests;

public sealed class UserSubscriptionAdditionalTests
{
    [Fact]
    public async Task GetSubscriptionQueryHandler_ShouldClampDaysRemainingToZero_WhenExpired()
    {
        var sub = new UserSubscription
        {
            UserId = Guid.NewGuid(),
            Tier = SubscriptionTier.Basic,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow.AddDays(-1)
        };

        var repo = new Mock<ISubscriptionRepository>();
        repo.Setup(r => r.GetByUserIdAsync(sub.UserId, It.IsAny<CancellationToken>())).ReturnsAsync(sub);

        var handler = new GetSubscriptionQueryHandler(repo.Object);
        var dto = await handler.Handle(new GetSubscriptionQuery(sub.UserId), CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(0, dto!.DaysRemaining);
    }

    [Fact]
    public async Task GetSubscriptionQueryHandler_ShouldReturnNullDaysRemaining_WhenSubscriptionHasNoEndDate()
    {
        var sub = new UserSubscription
        {
            UserId = Guid.NewGuid(),
            Tier = SubscriptionTier.Premium,
            Status = SubscriptionStatus.Active,
            EndDate = null
        };

        var repo = new Mock<ISubscriptionRepository>();
        repo.Setup(r => r.GetByUserIdAsync(sub.UserId, It.IsAny<CancellationToken>())).ReturnsAsync(sub);

        var handler = new GetSubscriptionQueryHandler(repo.Object);
        var dto = await handler.Handle(new GetSubscriptionQuery(sub.UserId), CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Null(dto!.DaysRemaining);
    }

    [Fact]
    public void HasFeature_ShouldReturnTrue_ForFamilySharing_WhenActiveAndEnabled()
    {
        var subscription = new UserSubscription
        {
            Status = SubscriptionStatus.Active,
            EndDate = DateTime.UtcNow.AddDays(10),
            HasFamilySharing = true
        };

        Assert.True(subscription.HasFeature("family_sharing"));
    }

    [Fact]
    public void IsActive_ShouldReturnFalse_WhenStatusIsNotActive_EvenWithFutureEndDate()
    {
        var subscription = new UserSubscription
        {
            Status = SubscriptionStatus.Cancelled,
            EndDate = DateTime.UtcNow.AddDays(10)
        };

        Assert.False(subscription.IsActive());
    }

    [Fact]
    public void HasFeature_ShouldBeCaseSensitive_ForFeatureName()
    {
        var subscription = new UserSubscription
        {
            Status = SubscriptionStatus.Active,
            EndDate = DateTime.UtcNow.AddDays(3),
            HasAIAssistant = true
        };

        Assert.False(subscription.HasFeature("AI_ASSISTANT"));
        Assert.True(subscription.HasFeature("ai_assistant"));
    }
}
