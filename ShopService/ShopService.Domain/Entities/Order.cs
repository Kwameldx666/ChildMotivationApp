using ShopService.Domain.Enums;

namespace ShopService.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    
    // Fields for reward delivery confirmation
    public DateTime? DeliveredAt { get; set; }
    public string? DeliveredByUserId { get; set; } // ID of the parent who delivered the reward
    public DateTime? ConfirmedAt { get; set; }
    public string? ConfirmedByUserId { get; set; } // ID of the child who confirmed receipt
    public string? DeliveryNotes { get; set; } // Notes about reward delivery

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
