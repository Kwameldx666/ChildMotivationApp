using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.User;

/// <summary>
/// DTO подписки пользователя
/// </summary>
[ExcludeFromCodeCoverage]
public record SubscriptionDto(
    string Tier,
    string Status,
    DateTime StartDate,
    DateTime? EndDate,
    decimal PricePerMonth,
    bool AutoRenew,
    int MaxChildren,
    int MaxTasksPerDay,
    bool HasAIAssistant,
    bool HasAdvancedAnalytics,
    bool HasCustomRewards,
    bool HasPrioritySupport,
    bool HasFamilySharing,
    bool HasOfflineMode,
    int? DaysRemaining);



