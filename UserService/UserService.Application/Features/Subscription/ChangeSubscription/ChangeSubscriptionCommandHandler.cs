using MediatR;
using UserService.Application.Dto.User;
using UserService.Application.Interfaces;
using UserService.Domain.Enums;
using UserService.Domain.Factories;

namespace UserService.Application.Features.Subscription.ChangeSubscription;

public class ChangeSubscriptionCommandHandler : IRequestHandler<ChangeSubscriptionCommand, SubscriptionDto>
{
    private readonly ISubscriptionRepository _subscriptionRepository;

    public ChangeSubscriptionCommandHandler(ISubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<SubscriptionDto> Handle(ChangeSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var existingSubscription = await _subscriptionRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        // Создаем новую подписку с выбранным тарифом
        var newSubscription = SubscriptionFactory.Create(request.NewTier);
        newSubscription.UserId = request.UserId;
        newSubscription.AutoRenew = request.AutoRenew;
        newSubscription.StartDate = DateTime.UtcNow;
        
        // Если это платная подписка, устанавливаем срок на месяц
        if (request.NewTier != SubscriptionTier.Free)
        {
            newSubscription.EndDate = DateTime.UtcNow.AddMonths(1);
        }
        else
        {
            newSubscription.EndDate = null;
        }

        if (existingSubscription is not null)
        {
            // Обновляем существующую подписку
            existingSubscription.Tier = request.NewTier;
            existingSubscription.Status = SubscriptionStatus.Active;
            existingSubscription.StartDate = newSubscription.StartDate;
            existingSubscription.EndDate = newSubscription.EndDate;
            existingSubscription.PricePerMonth = newSubscription.PricePerMonth;
            existingSubscription.AutoRenew = newSubscription.AutoRenew;
            existingSubscription.MaxChildren = newSubscription.MaxChildren;
            existingSubscription.MaxTasksPerDay = newSubscription.MaxTasksPerDay;
            existingSubscription.HasAIAssistant = newSubscription.HasAIAssistant;
            existingSubscription.HasAdvancedAnalytics = newSubscription.HasAdvancedAnalytics;
            existingSubscription.HasCustomRewards = newSubscription.HasCustomRewards;
            existingSubscription.HasPrioritySupport = newSubscription.HasPrioritySupport;
            existingSubscription.HasFamilySharing = newSubscription.HasFamilySharing;
            existingSubscription.HasOfflineMode = newSubscription.HasOfflineMode;

            await _subscriptionRepository.UpdateAsync(existingSubscription, cancellationToken);
            
            return MapToDto(existingSubscription);
        }
        else
        {
            // Создаем новую подписку
            await _subscriptionRepository.CreateAsync(newSubscription, cancellationToken);
            
            return MapToDto(newSubscription);
        }
    }

    private static SubscriptionDto MapToDto(Domain.Entities.UserSubscription subscription)
    {
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
