using Microsoft.AspNetCore.Mvc;

namespace ShopService.Api.Controllers;

[ApiController]
[Route("shop-service/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "healthy" });
}
