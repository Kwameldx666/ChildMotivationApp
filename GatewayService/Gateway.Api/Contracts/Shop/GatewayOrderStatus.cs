namespace Gateway.Contracts.Shop;

public enum GatewayOrderStatus
{
    Pending = 0,
    Paid = 1,
    Shipped = 2,
    Completed = 3,
    Cancelled = 4
}