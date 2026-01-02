using System.ComponentModel.DataAnnotations;

namespace Gateway.Api.Contracts.Shop;

public enum GatewayOrderStatus
{
    Pending = 0,
    Paid = 1,
    Shipped = 2,
    Completed = 3,
    Cancelled = 4
}

public class UpdateOrderStatusRequest
{
    [Required]
    public GatewayOrderStatus Status { get; init; }
}
