using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Api.Authorization;
using UserService.Api.Contracts.Profile;
using UserService.Application.Features.Profile.GetFamilyMembers;
using UserService.Application.Features.Profile.GetUserProfile;
using UserService.Application.Features.Profile.UpdateUserProfile;

namespace UserService.Api.Controllers;

[ApiController]
[Route("user-service/[controller]")]
public class ProfileController(IMediator mediator, UserService.Infrastructure.Services.Avatar.IAvatarStore avatarStore) : ControllerBase
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
        if (!TryResolveUserId(out var userId, out var errorResult))
        {
            return errorResult ?? Unauthorized("User identifier is missing.");
        }

        var profile = await mediator.Send(new GetUserProfileQuery(userId), cancellationToken);
        if (profile is null)
        {
            return NotFound();
        }

        return Ok(profile);
    }

    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("{userId:guid}/family-members")]
    public async Task<IActionResult> GetFamilyMembersAsync(Guid userId, CancellationToken cancellationToken)
    {
        var members = await mediator.Send(new GetFamilyMembersQuery(userId), cancellationToken);
        return Ok(members);
    }

    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("me/family-members")]
    public async Task<IActionResult> GetCurrentFamilyMembersAsync(CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId, out var errorResult))
        {
            return errorResult ?? Unauthorized("User identifier is missing.");
        }

        var members = await mediator.Send(new GetFamilyMembersQuery(userId), cancellationToken);
        return Ok(members);
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

    [HttpPost("{userId:guid}/avatar")]
    public async Task<IActionResult> UploadAvatarAsync(Guid userId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest("File is required");

        string url;
        try
        {
            url = await avatarStore.SaveAsync(userId, file, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var updated = await mediator.Send(new UpdateUserProfileCommand(userId, null, null, url, null), cancellationToken);
        if (updated is null)
            return NotFound();

        return Ok(updated);
    }

    private bool TryResolveUserId(out Guid userId, out IActionResult? errorResult)
    {
        userId = Guid.Empty;
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrWhiteSpace(userIdValue) || !Guid.TryParse(userIdValue, out var resolvedUserId))
        {
            errorResult = Unauthorized("User identifier is missing.");
            return false;
        }

        userId = resolvedUserId;
        errorResult = null;
        return true;
    }
}
