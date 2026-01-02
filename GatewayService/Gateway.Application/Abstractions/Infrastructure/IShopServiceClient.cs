namespace Gateway.Application.Abstractions.Infrastructure;

public interface IShopServiceClient
{
    Task<System.Net.Http.HttpResponseMessage> GetProductsAsync(CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetProductAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> CreateProductAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UpdateProductAsync(Guid id, object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);

    Task<System.Net.Http.HttpResponseMessage> GetOrdersAsync(string? userId = null, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetOrderAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> CreateOrderAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UpdateOrderStatusAsync(Guid id, object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> DeleteOrderAsync(Guid id, CancellationToken cancellationToken = default);
}
