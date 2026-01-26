using UserService.Domain.Enums;

namespace UserService.Domain.Entities;

/// <summary>
/// Подписка пользователя
/// </summary>
public class UserSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public SubscriptionTier Tier { get; set; } = SubscriptionTier.Free;
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    public bool AutoRenew { get; set; } = true;
    public decimal PricePerMonth { get; set; }
    
    // Premium фичи
    public int MaxChildren { get; set; } = 2;              // Free: 2, Basic: 5, Premium: 10, Family: unlimited
    public int MaxTasksPerDay { get; set; } = 10;          // Free: 10, Basic: 50, Premium: 100, Family: unlimited
    public bool HasAIAssistant { get; set; }               // Basic+
    public bool HasAdvancedAnalytics { get; set; }         // Premium+
    public bool HasCustomRewards { get; set; }             // Premium+
    public bool HasPrioritySupport { get; set; }           // Premium+
    public bool HasFamilySharing { get; set; }             // Family
    public bool HasOfflineMode { get; set; }               // Premium+
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Проверяет, активна ли подписка
    /// </summary>
    public bool IsActive()
    {
        return Status == SubscriptionStatus.Active && 
               (EndDate == null || EndDate > DateTime.UtcNow);
    }

    /// <summary>
    /// Проверяет, есть ли доступ к функции
    /// </summary>
    public bool HasFeature(string featureName)
    {
        if (!IsActive()) return false;

        return featureName switch
        {
            "ai_assistant" => HasAIAssistant,
            "advanced_analytics" => HasAdvancedAnalytics,
            "custom_rewards" => HasCustomRewards,
            "priority_support" => HasPrioritySupport,
            "family_sharing" => HasFamilySharing,
            "offline_mode" => HasOfflineMode,
            _ => false
        };
    }
}
