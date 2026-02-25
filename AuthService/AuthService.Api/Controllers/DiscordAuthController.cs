using AuthService.Application.Features.Authentication.External.Discord.CompleteSignIn;
using AuthService.Application.Features.Authentication.External.Discord.GetAuthorizationUrl;
using AuthService.Application.Features.Authentication.External.Discord.SignIn;
using AuthService.Extensions;
using AuthService.Infrastructure.Options.External;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Controllers;

[Route("auth-service/discord")]
public class  DiscordAuthController(IMediator mediator, IOptions<DiscordOptions> discordOptions) : ControllerBase
{
    [HttpGet("authorize")]
    public async Task<IActionResult> GetDiscordAuthorizationUrlAsync(CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetDiscordAuthorizationUrlQuery(), cancellationToken);
        return response.ToActionResult();
    }

    [HttpGet("callback")]
    public async Task<IActionResult> DiscordCallbackAsync([FromQuery] string code, [FromQuery] string state,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DiscordSignInCommand(state, code), cancellationToken);
        if (!result.IsSuccess)
        {
            var redirectBaseError = discordOptions.Value.PostSignInRedirectUri;
            var errorQuery = new Dictionary<string, string?>
            {
                ["oauth_status"] = "error",
                ["oauth_error"] = result.Error?.ErrorDescription ?? "Authentication failed.",
                ["oauth_provider"] = "discord"
            };

            var errorRedirect = QueryHelpers.AddQueryString(redirectBaseError, errorQuery);
            return Redirect(errorRedirect);
        }

        var redirectBase = discordOptions.Value.PostSignInRedirectUri;
        var query = new Dictionary<string, string?>
        {
            ["oauth_status"] = result.Value!.Status.ToString().ToLowerInvariant(),
            ["oauth_token"] = result.Value!.Token,
            ["oauth_provider"] = "discord"
        };

        var redirectUrl = QueryHelpers.AddQueryString(redirectBase, query);
        return Redirect(redirectUrl);
    }
    
    [HttpPost("complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteDiscordSignInCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }
}