using MediatR;
using UserService.Application.Dto.User;
using UserService.Application.Interfaces;
using UserService.Domain.Enums;
using UserService.Domain.Factories;

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

        // Отменяем подписку (переводим на Free)
        var freeSubscription = SubscriptionFactory.Create(SubscriptionTier.Free);
        
        subscription.Tier = SubscriptionTier.Free;
        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.EndDate = DateTime.UtcNow;
        subscription.AutoRenew = false;
        subscription.PricePerMonth = 0;
        subscription.MaxChildren = freeSubscription.MaxChildren;
        subscription.MaxTasksPerDay = freeSubscription.MaxTasksPerDay;
        subscription.HasAIAssistant = false;
        subscription.HasAdvancedAnalytics = false;
        subscription.HasCustomRewards = false;
        subscription.HasPrioritySupport = false;
        subscription.HasFamilySharing = false;
        subscription.HasOfflineMode = false;

        await _subscriptionRepository.UpdateAsync(subscription, cancellationToken);

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
            DaysRemaining: null);
    }
}
