using MediatR;
using UserService.Application.Dto.User;
using UserService.Domain.Enums;

namespace UserService.Application.Features.Subscription.ChangeSubscription;

public record ChangeSubscriptionCommand(
    Guid UserId,
    SubscriptionTier NewTier,
    bool AutoRenew = true) : IRequest<SubscriptionDto>;
