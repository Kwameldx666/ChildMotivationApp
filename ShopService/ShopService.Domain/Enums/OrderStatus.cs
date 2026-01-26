namespace ShopService.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,          // Ожидает оплаты
    Paid = 1,             // Оплачен (списаны баллы)
    AwaitingDelivery = 2, // Ожидает выдачи награды
    Delivered = 3,        // Награда выдана (подтверждено родителем)
    Confirmed = 4,        // Получение подтверждено (ребёнком)
    Completed = 5,        // Завершён
    Cancelled = 6         // Отменён
}
