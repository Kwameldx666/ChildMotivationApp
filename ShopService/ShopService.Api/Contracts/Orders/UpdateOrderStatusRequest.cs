using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;
using ShopService.Domain.Enums;

namespace ShopService.Api.Contracts.Orders;

[ExcludeFromCodeCoverage]

public class UpdateOrderStatusRequest
{
    [Required(ErrorMessage = "Необходимо указать статус заказа")]
    [EnumDataType(typeof(OrderStatus), ErrorMessage = "Некорректный статус заказа")]
    public OrderStatus Status { get; init; }
}



