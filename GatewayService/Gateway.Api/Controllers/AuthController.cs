using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Auth;
using Gateway.Application.Dto.Login;
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

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        using var response = await authClient.LoginAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest("Refresh token is required.");
        }

        using var response = await authClient.RefreshAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("signin-google")]
    public async Task<IActionResult> GoogleCallback(CancellationToken cancellationToken)
    {
        using var response = await authClient.GoogleSignIn(cancellationToken);
        return await response.ToActionResultAsync();
    }
}