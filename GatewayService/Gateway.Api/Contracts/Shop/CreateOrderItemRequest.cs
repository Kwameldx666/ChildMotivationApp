using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

public class CreateOrderItemRequest
{
    [Required] public Guid ProductId { get; init; }

    [Range(1, 1000)] public int Quantity { get; init; }
}