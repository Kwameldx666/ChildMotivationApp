using AuthService.Application.Features.Authentication.SignIn.GitHub;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[Route("auth-service/github")]
public class GitHubAuthController(IMediator mediator) : ControllerBase
{
    [HttpGet("authorize")]
    public async Task<IActionResult> GetGitHubAuthorizationUrlAsync(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetGitHubAuthorizationUrlQuery(), cancellationToken);
        return result.ToActionResult();
    }
}