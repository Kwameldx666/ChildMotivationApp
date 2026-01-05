using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

public class CreateOrderRequest
{
    [MinLength(1, ErrorMessage = "Order must contain at least one item")]
    public List<CreateOrderItemRequest> Items { get; init; } = new();
}