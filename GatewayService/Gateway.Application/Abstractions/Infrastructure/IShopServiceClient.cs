namespace Gateway.Application.Abstractions.Infrastructure;

public interface IShopServiceClient
{
    Task<HttpResponseMessage> GetProductsAsync(CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> GetProductAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> CreateProductAsync(object request, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage>
        UpdateProductAsync(Guid id, object request, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> GetOrdersAsync(string? userId = null, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> GetOrderAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> CreateOrderAsync(object request, CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> UpdateOrderStatusAsync(Guid id, object request,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> DeleteOrderAsync(Guid id, CancellationToken cancellationToken = default);
}