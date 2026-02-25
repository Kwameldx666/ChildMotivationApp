using System.ComponentModel.DataAnnotations;

namespace ShopService.Api.Contracts.Orders;

/// <summary>
/// Запрос для подтверждения ребёнком получения награды
/// </summary>
public class ConfirmOrderReceivedRequest
{
    [Required(ErrorMessage = "Необходимо указать ID ребёнка")]
    public string ConfirmedByUserId { get; init; } = string.Empty;
}
