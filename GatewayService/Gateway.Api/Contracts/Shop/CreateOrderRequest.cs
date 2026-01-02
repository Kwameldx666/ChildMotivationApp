using System.ComponentModel.DataAnnotations;

namespace Gateway.Api.Contracts.Shop;

public class CreateOrderRequest
{
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
