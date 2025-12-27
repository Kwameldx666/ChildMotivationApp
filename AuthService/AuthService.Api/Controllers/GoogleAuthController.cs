using AuthService.Application.Features.Authentication.External.Google.CompleteGoogle;
using AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;
using AuthService.Application.Features.Authentication.External.Google.SignIn;
using AuthService.Extensions;
using AuthService.Infrastructure.Options.External;
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
                ["oauth_error"] = result.Error?.ErrorDescription ?? "Authentication failed.",
                ["oauth_provider"] = "google"
            };

            var errorRedirect = QueryHelpers.AddQueryString(redirectBaseError, errorQuery);
            return Redirect(errorRedirect);
        }

        var redirectBase = googleOptions.Value.PostSignInRedirectUri;
        var query = new Dictionary<string, string?>
        {
            ["oauth_status"] = result.Value!.Status.ToString().ToLowerInvariant(),
            ["oauth_token"] = result.Value!.Token,
            ["oauth_provider"] = "google"
        };

        var redirectUrl = QueryHelpers.AddQueryString(redirectBase, query);
        return Redirect(redirectUrl);
    }
    
    [HttpPost("complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteGoogleSignInCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }
}