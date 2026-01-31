using MediatR;
using UserService.Application.Dto.User;
using UserService.Application.Interfaces;
using UserService.Domain.Enums;
using UserService.Domain.Factories;

namespace UserService.Application.Features.Subscription.GetSubscription;

public class GetSubscriptionQueryHandler : IRequestHandler<GetSubscriptionQuery, SubscriptionDto?>
{
    private readonly ISubscriptionRepository _subscriptionRepository;

    public GetSubscriptionQueryHandler(ISubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<SubscriptionDto?> Handle(GetSubscriptionQuery request, CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        // Если подписки нет, возвращаем бесплатную по умолчанию
        if (subscription is null)
        {
            return new SubscriptionDto(
                Tier: SubscriptionTier.Free.ToString(),
                Status: SubscriptionStatus.Active.ToString(),
                StartDate: DateTime.UtcNow,
                EndDate: null,
                PricePerMonth: 0,
                AutoRenew: false,
                MaxChildren: 2,
                MaxTasksPerDay: 10,
                HasAIAssistant: false,
                HasAdvancedAnalytics: false,
                HasCustomRewards: false,
                HasPrioritySupport: false,
                HasFamilySharing: false,
                HasOfflineMode: false,
                DaysRemaining: null);
        }

        int? daysRemaining = subscription.EndDate.HasValue
            ? (int)Math.Max(0, (subscription.EndDate.Value - DateTime.UtcNow).TotalDays)
            : null;

        return new SubscriptionDto(
            Tier: subscription.Tier.ToString(),
            Status: subscription.Status.ToString(),
            StartDate: subscription.StartDate,
            EndDate: subscription.EndDate,
            PricePerMonth: subscription.PricePerMonth,
            AutoRenew: subscription.AutoRenew,
            MaxChildren: subscription.MaxChildren,
            MaxTasksPerDay: subscription.MaxTasksPerDay,
            HasAIAssistant: subscription.HasAIAssistant,
            HasAdvancedAnalytics: subscription.HasAdvancedAnalytics,
            HasCustomRewards: subscription.HasCustomRewards,
            HasPrioritySupport: subscription.HasPrioritySupport,
            HasFamilySharing: subscription.HasFamilySharing,
            HasOfflineMode: subscription.HasOfflineMode,
            DaysRemaining: daysRemaining);
    }
}
