using System.Diagnostics.CodeAnalysis;

namespace ShopService.Domain.Enums;

[ExcludeFromCodeCoverage]
public enum OrderStatus
{
    Pending = 0,          // Awaiting payment
    Paid = 1,             // Paid (points deducted)
    AwaitingDelivery = 2, // Awaiting reward delivery
    Delivered = 3,        // Reward delivered (confirmed by parent)
    Confirmed = 4,        // Receipt confirmed (by child)
    Completed = 5,        // Completed
    Cancelled = 6         // Cancelled
}
