namespace UserService.Domain.Enums;

/// <summary>
/// Premium subscription type
/// </summary>
public enum SubscriptionTier
{
    Free = 0,           // Free tier
    Basic = 1,          // Basic - 299 RUB/month
    Premium = 2,        // Premium - 599 RUB/month
    Family = 3          // Family - 899 RUB/month
}
