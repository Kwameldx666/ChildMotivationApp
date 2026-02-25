using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Shop;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/shop/products")]
public class ShopProductsController(IShopServiceClient shopClient) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        using var response = await shopClient.GetProductsAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        using var response = await shopClient.GetProductAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertProductRequest payload,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var upstreamPayload = new
        {
            name = payload.Name,
            description = payload.Description,
            price = payload.Price,
            stock = payload.Stock,
            isActive = payload.IsActive
        };

        using var response = await shopClient.CreateProductAsync(upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertProductRequest payload,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var upstreamPayload = new
        {
            name = payload.Name,
            description = payload.Description,
            price = payload.Price,
            stock = payload.Stock,
            isActive = payload.IsActive
        };

        using var response = await shopClient.UpdateProductAsync(id, upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        using var response = await shopClient.DeleteProductAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }
}