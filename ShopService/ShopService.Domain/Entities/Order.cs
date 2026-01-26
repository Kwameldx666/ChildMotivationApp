using ShopService.Domain.Enums;

namespace ShopService.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    
    // Поля для подтверждения выдачи награды
    public DateTime? DeliveredAt { get; set; }
    public string? DeliveredByUserId { get; set; } // ID родителя, который выдал награду
    public DateTime? ConfirmedAt { get; set; }
    public string? ConfirmedByUserId { get; set; } // ID ребёнка, подтвердившего получение
    public string? DeliveryNotes { get; set; } // Комментарии к выдаче награды

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
