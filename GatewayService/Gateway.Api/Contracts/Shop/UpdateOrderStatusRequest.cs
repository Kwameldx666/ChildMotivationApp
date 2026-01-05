using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

public class UpdateOrderStatusRequest
{
    [Required] public GatewayOrderStatus Status { get; init; }
}