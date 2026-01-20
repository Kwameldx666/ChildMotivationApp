using ShopService.Domain.Entities;
using System.Text.Json.Serialization;

namespace ShopService.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }

    [JsonIgnore]
    public Order? Order { get; set; }
    [JsonIgnore]
    public Product? Product { get; set; }
}
