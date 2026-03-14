using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.Subscription;

[ExcludeFromCodeCoverage]

public record ChangeSubscriptionRequest(
    string Tier,
    bool AutoRenew = true);


