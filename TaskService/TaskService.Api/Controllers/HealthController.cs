using Microsoft.AspNetCore.Mvc;

namespace TaskService.Api.Controllers;

[ApiController]
[Route("task-service/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "healthy" });
}