using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Register;
using Gateway.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Controllers;

[ApiController]
[Route("api-gateway/[controller]")]
public class AuthController(IAuthServiceClient authClient) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        using var response = await authClient.RegisterAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }
}