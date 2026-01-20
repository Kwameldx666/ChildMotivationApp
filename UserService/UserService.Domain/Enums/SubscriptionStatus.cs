namespace UserService.Domain.Enums;

/// <summary>
/// Статус подписки
/// </summary>
public enum SubscriptionStatus
{
    Active = 0,         // Активна
    Expired = 1,        // Истекла
    Cancelled = 2,      // Отменена
    PendingPayment = 3  // Ожидает оплаты
}
