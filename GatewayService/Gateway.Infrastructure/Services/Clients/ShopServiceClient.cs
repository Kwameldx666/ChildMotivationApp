using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class ShopServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<ShopEndpoints> endpoints)
    : IShopServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.ShopService);
    private readonly ShopEndpoints _endpoints = endpoints.Value;

    public Task<HttpResponseMessage> GetProductsAsync(CancellationToken cancellationToken = default)
    {
        var uri = BuildProductsPath();
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, uri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var uri = $"{BuildProductsPath()}/{id}";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, uri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> CreateProductAsync(object request, CancellationToken cancellationToken = default)
    {
        var uri = BuildProductsPath();
        return _client.SendHttpRequestAsync(HttpMethod.Post, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> UpdateProductAsync(Guid id, object request,
        CancellationToken cancellationToken = default)
    {
        var uri = $"{BuildProductsPath()}/{id}";
        return _client.SendHttpRequestAsync(HttpMethod.Put, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var uri = $"{BuildProductsPath()}/{id}";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Delete, uri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetOrdersAsync(string? userId = null,
        CancellationToken cancellationToken = default)
    {
        var uri = BuildOrdersPath();
        if (!string.IsNullOrWhiteSpace(userId))
            uri = QueryHelpers.AddQueryString(uri, "userId", userId);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, uri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetOrderAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var uri = $"{BuildOrdersPath()}/{id}";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, uri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> CreateOrderAsync(object request, CancellationToken cancellationToken = default)
    {
        var uri = BuildOrdersPath();
        return _client.SendHttpRequestAsync(HttpMethod.Post, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> UpdateOrderStatusAsync(Guid id, object request,
        CancellationToken cancellationToken = default)
    {
        var uri = $"{BuildOrdersPath()}/{id}/status";
        return _client.SendHttpRequestAsync(HttpMethod.Put, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> DeleteOrderAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var uri = $"{BuildOrdersPath()}/{id}";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Delete, uri, null, SerializerOptions, cancellationToken);
    }

    private string BuildProductsPath()
    {
        var basePath = _endpoints.Products;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("ShopService products endpoint is not configured.");
        return basePath.TrimEnd('/');
    }

    private string BuildOrdersPath()
    {
        var basePath = _endpoints.Orders;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("ShopService orders endpoint is not configured.");
        return basePath.TrimEnd('/');
    }
}