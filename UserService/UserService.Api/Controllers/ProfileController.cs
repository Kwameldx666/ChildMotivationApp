using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Api.Authorization;
using UserService.Api.Contracts.Profile;
using UserService.Application.Features.Profile.GetUserProfile;
using UserService.Application.Features.Profile.UpdateUserProfile;

namespace UserService.Api.Controllers;

[ApiController]
[Route("user-service/[controller]")]
public class ProfileController(IMediator mediator) : ControllerBase
{
    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var profile = await mediator.Send(new GetUserProfileQuery(userId), cancellationToken);
        if (profile is null)
        {
            return NotFound();
        }

        return Ok(profile);
    }

    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentProfileAsync(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrWhiteSpace(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized("User identifier is missing.");
        }

        var profile = await mediator.Send(new GetUserProfileQuery(userId), cancellationToken);
        if (profile is null)
        {
            return NotFound();
        }

        return Ok(profile);
    }

    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateProfileAsync(Guid userId, [FromBody] UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest("Request body cannot be null.");
        }

        var updatedProfile = await mediator.Send(
            new UpdateUserProfileCommand(userId, request.Name, request.LastName, request.Avatar, request.Age),
            cancellationToken);

        if (updatedProfile is null)
        {
            return NotFound();
        }

        return Ok(updatedProfile);
    }
}
