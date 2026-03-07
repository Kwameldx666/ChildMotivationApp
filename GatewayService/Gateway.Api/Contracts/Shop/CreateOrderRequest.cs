using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Shop;

public class CreateOrderRequest
{
    [Required(ErrorMessage = "Заказ должен содержать хотя бы один товар")]
    [MinLength(1, ErrorMessage = "Заказ должен содержать хотя бы один товар")]
    [MaxLength(50, ErrorMessage = "Заказ не может содержать более 50 позиций")]
    public List<CreateOrderItemRequest> Items { get; init; } = new();
}