using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

[ExcludeFromCodeCoverage]

public class UpsertProductRequest
{
    [Required] [StringLength(200)] public string Name { get; init; } = string.Empty;

    [StringLength(2000)] public string? Description { get; init; }

    [Range(0.01, 1_000_000)] public decimal Price { get; init; }

    [Range(0, 1_000_000)] public int Stock { get; init; }

    public bool IsActive { get; init; } = true;
}

