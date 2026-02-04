using MediatR;
using UserService.Application.Dto.User;

namespace UserService.Application.Features.Subscription.GetSubscription;

public record GetSubscriptionQuery(Guid UserId) : IRequest<SubscriptionDto?>;
