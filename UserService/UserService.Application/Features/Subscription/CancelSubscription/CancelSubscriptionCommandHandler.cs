using MediatR;
using UserService.Application.Dto.User;
using UserService.Application.Interfaces;
using UserService.Domain.Enums;

namespace UserService.Application.Features.Subscription.CancelSubscription;

public class CancelSubscriptionCommandHandler : IRequestHandler<CancelSubscriptionCommand, SubscriptionDto>
{
    private readonly ISubscriptionRepository _subscriptionRepository;

    public CancelSubscriptionCommandHandler(ISubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<SubscriptionDto> Handle(CancelSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (subscription is null)
        {
            // Возвращаем бесплатную подписку
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

        // Cancel means disabling auto-renew, keeping current tier active until EndDate.
        subscription.CancelledAt = DateTime.UtcNow;
        subscription.AutoRenew = false;

        // Keep paid features to the end of current billing period.
        if (subscription.EndDate.HasValue && subscription.EndDate.Value <= DateTime.UtcNow)
        {
            subscription.Status = SubscriptionStatus.Expired;
        }
        else
        {
            subscription.Status = SubscriptionStatus.Active;
        }

        await _subscriptionRepository.UpdateAsync(subscription, cancellationToken);

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
