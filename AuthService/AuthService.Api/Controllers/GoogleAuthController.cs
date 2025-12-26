using AuthService.Application.Features.Authentication.SignIn.Google.CompleteGoogle;
using AuthService.Application.Features.Authentication.SignIn.Google.GetGoogleAuthorizationUrl;
using AuthService.Application.Features.Authentication.SignIn.Google.GetGooglePendingUser;
using AuthService.Application.Features.Authentication.SignIn.Google.GetGoogleSession;
using AuthService.Application.Features.Authentication.SignIn.Google.GoogleSignIn;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Controllers;

[Route("auth-service/google")]
public class GoogleAuthController(IMediator mediator, IOptions<GoogleOptions> googleOptions) : ControllerBase
{
    [HttpGet("authorize")]
    public async Task<IActionResult> GetGoogleAuthorizationUrlAsync(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetGoogleAuthorizationUrlQuery(), cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("callback")]
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

    [HttpGet("session/{token}")]
    public async Task<IActionResult> GetGoogleSessionAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetGoogleSessionQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("pending/{token}")]
    public async Task<IActionResult> GetPendingGoogleUserAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetGooglePendingUserQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteGoogleSignInCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }
}