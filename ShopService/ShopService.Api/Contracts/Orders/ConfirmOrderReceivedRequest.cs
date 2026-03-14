using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace ShopService.Api.Contracts.Orders;

/// <summary>
/// Запрос для подтверждения ребёнком получения награды
/// </summary>
[ExcludeFromCodeCoverage]
public class ConfirmOrderReceivedRequest
{
    [Required(ErrorMessage = "Необходимо указать ID ребёнка")]
    [StringLength(64, ErrorMessage = "ID ребёнка не может превышать 64 символа")]
    public string ConfirmedByUserId { get; init; } = string.Empty;
}



