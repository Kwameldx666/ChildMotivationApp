using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace ShopService.Api.Contracts.Orders;

/// <summary>
/// Запрос для подтверждения родителем выдачи награды
/// </summary>
[ExcludeFromCodeCoverage]
public class MarkOrderDeliveredRequest
{
    [Required(ErrorMessage = "Необходимо указать ID родителя")]
    [StringLength(64, ErrorMessage = "ID родителя не может превышать 64 символа")]
    public string DeliveredByUserId { get; init; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Комментарий не может превышать 1000 символов")]
    public string? Notes { get; init; }
}



