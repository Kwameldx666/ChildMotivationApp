using Microsoft.AspNetCore.Mvc;

namespace FamilyQuest.Gateway.Controllers;

[ApiController]
[Route("family-quest/[controller]")]
public class AuthController(ILogger<AuthController> logger) : ControllerBase
{
    private readonly ILogger<AuthController> _logger = logger;
}