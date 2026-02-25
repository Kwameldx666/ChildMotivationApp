using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopService.Api.Contracts.Products;
using ShopService.Domain.Entities;
using ShopService.Infrastructure.Abstractions;

namespace ShopService.Api.Controllers;

[ApiController]
[Authorize]
[Route("shop-service/[controller]")]
public class ProductsController(IProductStore store) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var products = await store.GetAllAsync(cancellationToken);
        return Ok(products);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var product = await store.GetAsync(id, cancellationToken);
        if (product is null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertProductRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Stock = request.Stock,
            IsActive = request.IsActive
        };

        var created = await store.CreateAsync(product, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertProductRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var existing = await store.GetAsync(id, cancellationToken);
        if (existing is null) return NotFound();

        existing.Name = request.Name;
        existing.Description = request.Description;
        existing.Price = request.Price;
        existing.Stock = request.Stock;
        existing.IsActive = request.IsActive;

        var ok = await store.UpdateAsync(existing, cancellationToken);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var ok = await store.DeleteAsync(id, cancellationToken);
        if (!ok) return NotFound();
        return NoContent();
    }
}
