namespace UserService.Application.Dto.Subscription;

public record ChangeSubscriptionRequest(
    string Tier,
    bool AutoRenew = true);
