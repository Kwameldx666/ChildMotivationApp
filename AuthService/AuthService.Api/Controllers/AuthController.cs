using System.Collections.Generic;
using AuthService.Application.Features.Authentication.ConfirmEmail;
using AuthService.Application.Features.Authentication.LoginUser;
using AuthService.Application.Features.Authentication.RefreshToken;
using AuthService.Application.Features.Authentication.RegisterChild;
using AuthService.Application.Features.Authentication.RegisterUser;
using AuthService.Application.Features.Authentication.ResendConfirmation;
using AuthService.Application.Features.Authentication.RevokeToken;
using AuthService.Application.Features.Authentication.SignIn.CompleteGoogle;
using AuthService.Application.Features.Authentication.SignIn.GetGoogleAuthorizationUrl;
using AuthService.Application.Features.Authentication.SignIn.GetGooglePendingUser;
using AuthService.Application.Features.Authentication.SignIn.GetGoogleSession;
using AuthService.Application.Features.Authentication.SignIn.GoogleSignIn;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Controllers;

[ApiController]
[Route("auth-service/[controller]")]
public class AuthController(IMediator mediator, IOptions<GoogleOptions> googleOptions) : ControllerBase
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

    [HttpGet("google/authorize")]
    public async Task<IActionResult> GetGoogleAuthorizationUrlAsync(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetGoogleAuthorizationUrlQuery(), cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallbackAsync([FromQuery] string code, [FromQuery] string state,
        CancellationToken cancellationToken)
    {
        var command = new GoogleSignInCommand(code, state);
        var result = await mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            var redirectBaseError = googleOptions.Value.PostSignInRedirectUri;
            var errorQuery = new Dictionary<string, string?>
            {
                ["oauth_status"] = "error",
                ["oauth_error"] = result.Error?.ErrorDescription ?? "Authentication failed."
            };

            var errorRedirect = QueryHelpers.AddQueryString(redirectBaseError, errorQuery);
            return Redirect(errorRedirect);
        }

        var redirectBase = googleOptions.Value.PostSignInRedirectUri;
        var query = new Dictionary<string, string?>
        {
            ["oauth_status"] = result.Value!.Status.ToString().ToLowerInvariant(),
            ["oauth_token"] = result.Value!.Token
        };

        var redirectUrl = QueryHelpers.AddQueryString(redirectBase, query);
        return Redirect(redirectUrl);
    }

    [HttpGet("google/session/{token}")]
    public async Task<IActionResult> GetGoogleSessionAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetGoogleSessionQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("google/pending/{token}")]
    public async Task<IActionResult> GetPendingGoogleUserAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetGooglePendingUserQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("google/complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteGoogleSignInCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmailAsync(
        [FromQuery] string userId,
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        var command = new ConfirmEmailCommand(userId, token);
        var result = await mediator.Send(command, cancellationToken);
        if (result.IsSuccess)
            return Content(
                "<html><body><h2>Почта успешно подтверждена!</h2><p>Теперь вы можете войти в свой аккаунт.</p></body></html>",
                "text/html");
        return result.ToActionResult();
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmationAsync(
        [FromBody] ResendConfirmationCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("register-child")]
    public async Task<IActionResult> RegisterChildAsync(
        [FromBody] RegisterChildCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }
}