using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace ShopService.Api.Contracts.Orders;

[ExcludeFromCodeCoverage]

public class CreateOrderRequest
{
    [Required(ErrorMessage = "Необходимо указать ID пользователя")]
    [StringLength(64, ErrorMessage = "ID пользователя не может превышать 64 символа")]
    public string UserId { get; init; } = string.Empty;

    [Required(ErrorMessage = "Заказ должен содержать хотя бы один товар")]
    [MinLength(1, ErrorMessage = "Заказ должен содержать хотя бы один товар")]
    [MaxLength(50, ErrorMessage = "Заказ не может содержать более 50 позиций")]
    public List<CreateOrderItemRequest> Items { get; init; } = new();
}

[ExcludeFromCodeCoverage]

public class CreateOrderItemRequest
{
    [Required(ErrorMessage = "Необходимо указать ID товара")]
    public Guid ProductId { get; init; }

    [Range(1, 100, ErrorMessage = "Количество должно быть от 1 до 100")]
    public int Quantity { get; init; }
}



