using System.ComponentModel.DataAnnotations;
using ShopService.Domain.Enums;

namespace ShopService.Api.Contracts.Orders;

public class UpdateOrderStatusRequest
{
    [Required]
    public OrderStatus Status { get; init; }
}
