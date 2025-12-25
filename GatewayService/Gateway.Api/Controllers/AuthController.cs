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

    [HttpGet("google/authorize")]
    public async Task<IActionResult> GetGoogleAuthorizationAsync(CancellationToken cancellationToken)
    {
        using var response = await authClient.GetGoogleAuthorizationAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("google/session/{token}")]
    public async Task<IActionResult> GetGoogleSessionAsync([FromRoute] string token, CancellationToken cancellationToken)
    {
        using var response = await authClient.GetGoogleSessionAsync(token, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("google/pending/{token}")]
    public async Task<IActionResult> GetGooglePendingUserAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.GetGooglePendingUserAsync(token, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("google/complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteGoogleSignInRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.CompleteGoogleSignInAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }
}