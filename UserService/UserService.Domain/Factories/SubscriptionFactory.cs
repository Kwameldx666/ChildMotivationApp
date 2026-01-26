using UserService.Domain.Entities;
using UserService.Domain.Enums;

namespace UserService.Domain.Factories;

/// <summary>
/// Фабрика для создания подписок с предустановленными настройками
/// </summary>
public static class SubscriptionFactory
{
    private static readonly Dictionary<SubscriptionTier, decimal> MonthlyPrices = new()
    {
        { SubscriptionTier.Free, 0 },
        { SubscriptionTier.Basic, 4.99m },
        { SubscriptionTier.Premium, 9.99m },
        { SubscriptionTier.Family, 14.99m }
    };

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
                Name = "Бесплатный",
                Price = 0,
                Features = new[]
                {
                    "До 2 детей",
                    "До 10 задач в день",
                    "Базовые награды",
                    "Обычная поддержка"
                },
                Limitations = new[] { "Без AI помощника", "Без продвинутой аналитики" }
            },

            SubscriptionTier.Basic => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Базовый",
                Price = 299,
                Features = new[]
                {
                    "До 5 детей",
                    "До 50 задач в день",
                    "AI помощник",
                    "Все базовые награды",
                    "Обычная поддержка"
                }
            },

            SubscriptionTier.Premium => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Премиум",
                Price = 599,
                Features = new[]
                {
                    "До 10 детей",
                    "До 100 задач в день",
                    "AI помощник",
                    "Продвинутая аналитика",
                    "Кастомные награды",
                    "Приоритетная поддержка",
                    "Офлайн режим"
                },
                IsBestValue = true
            },

            SubscriptionTier.Family => new SubscriptionTierInfo
            {
                Tier = tier,
                Name = "Семейный",
                Price = 899,
                Features = new[]
                {
                    "Неограниченно детей",
                    "Неограниченно задач",
                    "AI помощник",
                    "Продвинутая аналитика",
                    "Кастомные награды",
                    "Приоритетная поддержка",
                    "Семейный доступ",
                    "Офлайн режим",
                    "Все премиум функции"
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
