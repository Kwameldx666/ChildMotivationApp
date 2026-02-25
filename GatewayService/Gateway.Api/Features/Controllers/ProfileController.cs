using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Features.User.DTOs;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/[controller]")]
public class ProfileController(IUserServiceClient userServiceClient) : ControllerBase
{
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetProfileAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentProfileAsync(CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetCurrentProfileAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("{userId:guid}/family-members")]
    public async Task<IActionResult> GetFamilyMembersAsync(Guid userId, CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetFamilyMembersAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("me/family-members")]
    public async Task<IActionResult> GetCurrentFamilyMembersAsync(CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetCurrentFamilyMembersAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateProfileAsync(Guid userId, [FromBody] UpdateProfileRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest("Request body cannot be null.");

        using var response = await userServiceClient.UpdateProfileAsync(userId, request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{userId:guid}/avatar")]
    public async Task<IActionResult> UploadAvatarAsync(Guid userId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest("File is required");

        using var stream = file.OpenReadStream();
        using var response =
            await userServiceClient.UploadAvatarAsync(userId, stream, file.FileName, file.ContentType,
                cancellationToken);
        return await response.ToActionResultAsync();
    }

    [AllowAnonymous]
    [HttpGet("avatars/{fileName}")]
    public async Task<IActionResult> GetAvatarAsync(string fileName, CancellationToken cancellationToken)
    {
        var response = await userServiceClient.GetAvatarFileAsync(fileName, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return NotFound();

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return File(stream, contentType);
    }
}