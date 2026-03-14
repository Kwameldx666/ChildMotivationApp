using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

[ExcludeFromCodeCoverage]

public class CreateOrderItemRequest
{
    [Required] public Guid ProductId { get; init; }

    [Range(1, 1000)] public int Quantity { get; init; }
}

