using Moq;
using UserService.Application.Dto.User;
using UserService.Application.Features.Profile.GetFamilyMembers;
using UserService.Application.Features.Subscription.GetSubscription;
using UserService.Application.Interfaces;
using UserService.Domain.Entities;
using UserService.Domain.Enums;

namespace UnitTests;

public sealed class UserApplicationHandlersTests
{
    [Fact]
    public async Task GetSubscriptionQueryHandler_ShouldReturnFreeTier_WhenSubscriptionMissing()
    {
        var repository = new Mock<ISubscriptionRepository>();
        repository.Setup(r => r.GetByUserIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserSubscription?)null);

        var handler = new GetSubscriptionQueryHandler(repository.Object);
        var result = await handler.Handle(new GetSubscriptionQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Free", result!.Tier);
        Assert.Equal(0, result.PricePerMonth);
        Assert.False(result.HasAIAssistant);
    }

    [Fact]
    public async Task GetSubscriptionQueryHandler_ShouldMapExistingSubscription()
    {
        var entity = new UserSubscription
        {
            UserId = Guid.NewGuid(),
            Tier = SubscriptionTier.Premium,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            PricePerMonth = 9.99m,
            AutoRenew = true,
            MaxChildren = 10,
            MaxTasksPerDay = 100,
            HasAIAssistant = true,
            HasAdvancedAnalytics = true,
            HasCustomRewards = true,
            HasPrioritySupport = true,
            HasFamilySharing = false,
            HasOfflineMode = true
        };

        var repository = new Mock<ISubscriptionRepository>();
        repository.Setup(r => r.GetByUserIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var handler = new GetSubscriptionQueryHandler(repository.Object);
        var result = await handler.Handle(new GetSubscriptionQuery(entity.UserId), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Premium", result!.Tier);
        Assert.True(result.HasAIAssistant);
        Assert.True(result.DaysRemaining.HasValue);
        Assert.True(result.DaysRemaining.Value >= 0);
    }

    [Fact]
    public async Task GetFamilyMembersQueryHandler_ShouldDelegateToProvider()
    {
        var members = new List<FamilyMemberDto>
        {
            new(Guid.NewGuid(), "Parent", "Alex", "Ivanov", null, null),
            new(Guid.NewGuid(), "Child", "Masha", null, null, 10)
        };

        var provider = new Mock<IUserProfileProvider>();
        provider.Setup(p => p.GetFamilyMembersAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(members);

        var handler = new GetFamilyMembersQueryHandler(provider.Object);
        var result = await handler.Handle(new GetFamilyMembersQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(2, result.Count);
    }
}
