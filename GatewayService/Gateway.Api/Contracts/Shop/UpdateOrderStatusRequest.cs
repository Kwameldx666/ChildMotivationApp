using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

[ExcludeFromCodeCoverage]

public class UpdateOrderStatusRequest
{
    [Required] public GatewayOrderStatus Status { get; init; }
}

