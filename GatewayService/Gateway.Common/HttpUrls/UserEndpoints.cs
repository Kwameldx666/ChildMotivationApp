namespace Gateway.Common.HttpUrls;

public class UserEndpoints
{
    public string Profile { get; set; } = string.Empty;
    public string ProfileMe { get; set; } = string.Empty;
    public string FamilyMembers { get; set; } = string.Empty;
    public string FamilyMembersMe { get; set; } = string.Empty;

    // Subscription endpoints
    public string SubscriptionMe { get; set; } = string.Empty;
    public string Subscription { get; set; } = string.Empty;
    public string SubscriptionChange { get; set; } = string.Empty;
    public string SubscriptionCancel { get; set; } = string.Empty;
    public string SubscriptionTiers { get; set; } = string.Empty;
}