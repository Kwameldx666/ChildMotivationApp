using MediatR;
using UserService.Application.Dto.User;

namespace UserService.Application.Features.Subscription.CancelSubscription;

public record CancelSubscriptionCommand(Guid UserId) : IRequest<SubscriptionDto>;
