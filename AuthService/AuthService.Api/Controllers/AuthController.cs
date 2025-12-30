using AuthService.Application.Features.Authentication.Password.Login;
using AuthService.Application.Features.Authentication.Password.RefreshToken;
using AuthService.Application.Features.Authentication.Password.Register;
using AuthService.Application.Features.Authentication.Password.RevokeToken;
using AuthService.Application.Features.Cache.PendingUser;
using AuthService.Application.Features.Cache.Session.Get;
using AuthService.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[ApiController]
[Route("auth-service")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> RegisterUserAsync([FromBody] RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("login")]
    public async Task<IActionResult> LoginUserAsync([FromBody] LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshTokenAsync([FromBody] RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> RevokeRefreshTokenAsync([FromBody] RevokeRefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("session/{token}")]
    public async Task<IActionResult> GetGoogleSessionAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetSessionQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("pending/{token}")]
    public async Task<IActionResult> GetPendingGoogleUserAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetPendingUserQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    // Lightweight health endpoint to satisfy container readiness checks
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "ok" });
    }
}