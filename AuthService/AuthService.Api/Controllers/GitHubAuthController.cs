using AuthService.Application.Features.Authentication.External.GitHub.CompleteSignIn;
using AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;
using AuthService.Application.Features.Authentication.External.GitHub.SignIn;
using AuthService.Extensions;
using AuthService.Infrastructure.Options.External;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Controllers;

[Route("auth-service/github")]
public class GitHubAuthController(IMediator mediator, IOptions<GitHubOptions> gitHubOptions) : ControllerBase
{
    [HttpGet("authorize")]
    public async Task<IActionResult> GetGitHubAuthorizationUrlAsync(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetGitHubAuthorizationUrlQuery(), cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("callback")]
    public async Task<IActionResult> GitHubCallbackAsync([FromQuery] string state, [FromQuery] string code,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GitHubSignInCommand(state, code), cancellationToken);
        if (!result.IsSuccess)
        {
            var redirectBaseError = gitHubOptions.Value.PostSignInRedirectUri;
            var errorQuery = new Dictionary<string, string?>
            {
                ["oauth_status"] = "error",
                ["oauth_error"] = result.Error?.ErrorDescription ?? "Authentication failed.",
                ["oauth_provider"] = "github"
            };

            var errorRedirect = QueryHelpers.AddQueryString(redirectBaseError, errorQuery);
            return Redirect(errorRedirect);
        }

        var redirectBase = gitHubOptions.Value.PostSignInRedirectUri;
        var query = new Dictionary<string, string?>
        {
            ["oauth_status"] = result.Value!.Status.ToString().ToLowerInvariant(),
            ["oauth_token"] = result.Value!.Token,
            ["oauth_provider"] = "github"
        };

        var redirectUrl = QueryHelpers.AddQueryString(redirectBase, query);
        return Redirect(redirectUrl);
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteGitHubSignInCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }
}