using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Shop;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/shop/orders")]
public class ShopOrdersController(IShopServiceClient shopClient) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        using var response = await shopClient.GetOrdersAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        using var response = await shopClient.GetOrderAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest payload, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var upstreamPayload = new
        {
            userId,
            items = payload.Items.Select(i => new { productId = i.ProductId, quantity = i.Quantity })
        };

        using var response = await shopClient.CreateOrderAsync(upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest payload,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var upstreamPayload = new { status = payload.Status };
        using var response = await shopClient.UpdateOrderStatusAsync(id, upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        using var response = await shopClient.DeleteOrderAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }
}