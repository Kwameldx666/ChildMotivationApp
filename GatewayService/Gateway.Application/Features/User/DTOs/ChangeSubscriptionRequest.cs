namespace Gateway.Application.Features.User.DTOs;

public record ChangeSubscriptionRequest(
    string Tier,
    bool AutoRenew = true);