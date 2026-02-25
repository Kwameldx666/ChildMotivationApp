using System.ComponentModel.DataAnnotations;

namespace ShopService.Api.Contracts.Orders;

public class CreateOrderRequest
{
    [Required]
    public string UserId { get; init; } = string.Empty;

    [MinLength(1, ErrorMessage = "Order must contain at least one item")]
    public List<CreateOrderItemRequest> Items { get; init; } = new();
}

public class CreateOrderItemRequest
{
    [Required]
    public Guid ProductId { get; init; }

    [Range(1, 1000)]
    public int Quantity { get; init; }
}
