using AuthService.Application.Features.Authentication.LoginUser;
using AuthService.Application.Features.Authentication.RefreshToken;
using AuthService.Application.Features.Authentication.RegisterUser;
using AuthService.Application.Features.Authentication.RevokeToken;
using AuthService.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[ApiController]
[Route("auth-service/")]
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
}