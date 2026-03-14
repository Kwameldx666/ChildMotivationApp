using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace ShopService.Api.Contracts.Products;

[ExcludeFromCodeCoverage]

public class UpsertProductRequest
{
    [Required(ErrorMessage = "Название товара обязательно")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Название должно быть от 2 до 200 символов")]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Описание не может превышать 2000 символов")]
    public string? Description { get; init; }

    [Range(1, 1_000_000, ErrorMessage = "Цена должна быть от 1 до 1 000 000")]
    public decimal Price { get; init; }

    [Range(0, 1_000_000, ErrorMessage = "Количество должно быть от 0 до 1 000 000")]
    public int Stock { get; init; }

    public bool IsActive { get; init; } = true;
}



