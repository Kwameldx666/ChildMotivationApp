using UserService.Domain.Entities;
using UserService.Domain.Enums;

namespace UserService.Domain.Factories;

/// <summary>
/// Factory for creating subscriptions with preset configurations
/// </summary>
public static class SubscriptionFactory
{
    private static readonly Dictionary<SubscriptionTier, decimal> MonthlyPrices = new()
    {
        { SubscriptionTier.Free, 0 },
        { SubscriptionTier.Basic, 299m },
        { SubscriptionTier.Premium, 599m },
        { SubscriptionTier.Family, 999m }
    };

    /// <summary>
    /// Creates a subscription with default settings (not bound to a user)
    /// </summary>
    public static UserSubscription Create(SubscriptionTier tier)
    {
        return CreateSubscription(Guid.Empty, tier, 1);
    }

    public static UserSubscription CreateSubscription(Guid userId, SubscriptionTier tier, int durationMonths = 1)
    {
        var subscription = new UserSubscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Tier = tier,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow,
            EndDate = tier == SubscriptionTier.Free ? null : DateTime.UtcNow.AddMonths(durationMonths),
            PricePerMonth = MonthlyPrices[tier],
            AutoRenew = tier != SubscriptionTier.Free
        };

        ApplyTierFeatures(subscription, tier);
        return subscription;
    }

    private static void ApplyTierFeatures(UserSubscription subscription, SubscriptionTier tier)
    {
        switch (tier)
        {
            case SubscriptionTier.Free:
                subscription.MaxChildren = 2;
                subscription.MaxTasksPerDay = 10;
                subscription.HasAIAssistant = false;
                subscription.HasAdvancedAnalytics = false;
                subscription.HasCustomRewards = false;
                subscription.HasPrioritySupport = false;
                subscription.HasFamilySharing = false;
                subscription.HasOfflineMode = false;
                break;

            case SubscriptionTier.Basic:
                subscription.MaxChildren = 5;
                subscription.MaxTasksPerDay = 50;
                subscription.HasAIAssistant = true;
                subscription.HasAdvancedAnalytics = false;
                subscription.HasCustomRewards = false;
                subscription.HasPrioritySupport = false;
                subscription.HasFamilySharing = false;
                subscription.HasOfflineMode = false;
                break;

            case SubscriptionTier.Premium:
                subscription.MaxChildren = 10;
                subscription.MaxTasksPerDay = 100;
                subscription.HasAIAssistant = true;
                subscription.HasAdvancedAnalytics = true;
                subscription.HasCustomRewards = true;
                subscription.HasPrioritySupport = true;
                subscription.HasFamilySharing = false;
                subscription.HasOfflineMode = true;
                break;

            case SubscriptionTier.Family:
                subscription.MaxChildren = int.MaxValue;
                subscription.MaxTasksPerDay = int.MaxValue;
                subscription.HasAIAssistant = true;
                subscription.HasAdvancedAnalytics = true;
                subscription.HasCustomRewards = true;
                subscription.HasPrioritySupport = true;
                subscription.HasFamilySharing = true;
                subscription.HasOfflineMode = true;
                break;
        }
    }

    public static SubscriptionTierInfo GetTierInfo(SubscriptionTier tier)
    {
        return tier switch
        {
            SubscriptionTier.Free => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Free",
                Price = 0,
                Features = new[]
                {
                    "Up to 2 children",
                    "Up to 10 tasks per day",
                    "Basic rewards",
                    "Standard support"
                },
                Limitations = new[] { "No AI assistant", "No advanced analytics" }
            },

            SubscriptionTier.Basic => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Basic",
                Price = 299,
                Features = new[]
                {
                    "Up to 5 children",
                    "Up to 50 tasks per day",
                    "AI assistant",
                    "All basic rewards",
                    "Standard support"
                }
            },

            SubscriptionTier.Premium => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Premium",
                Price = 599,
                Features = new[]
                {
                    "Up to 10 children",
                    "Up to 100 tasks per day",
                    "AI assistant",
                    "Advanced analytics",
                    "Custom rewards",
                    "Priority support",
                    "Offline mode"
                },
                IsBestValue = true
            },

            SubscriptionTier.Family => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Family",
                Price = 999,
                Features = new[]
                {
                    "Unlimited children",
                    "Unlimited tasks",
                    "AI assistant",
                    "Advanced analytics",
                    "Custom rewards",
                    "Priority support",
                    "Family sharing",
                    "Offline mode",
                    "All premium features"
                }
            },

            _ => throw new ArgumentException($"Unknown tier: {tier}")
        };
    }
}

public class SubscriptionTierInfo
{
    public SubscriptionTier Tier { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string[] Features { get; set; } = Array.Empty<string>();
    public string[] Limitations { get; set; } = Array.Empty<string>();
    public bool IsBestValue { get; set; }
}
