using System.Text.RegularExpressions;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Features.Auth.DTOs;
using Gateway.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Route("api-gateway/[controller]")]
public class AuthController(IAuthServiceClient authClient, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        // If client sent a base64 data URL for avatar, persist it in gateway wwwroot and replace Avatar with a public path
        var avatar = request?.Profile?.Avatar;
        if (!string.IsNullOrWhiteSpace(avatar) && avatar.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            try
            {
                var m = Regex.Match(avatar, "^data:(image/[^;]+);base64,(.+)", RegexOptions.IgnoreCase);
                if (m.Success)
                {
                    var contentType = m.Groups[1].Value;
                    var base64 = m.Groups[2].Value;
                    var bytes = Convert.FromBase64String(base64);

                    // Small validation
                    if (bytes.Length > 2 * 1024 * 1024) // 2MB
                        return BadRequest("Avatar file is too large (max 2MB)");

                    var ext = contentType switch
                    {
                        "image/png" => ".png",
                        "image/jpeg" => ".jpg",
                        "image/webp" => ".webp",
                        _ => ".bin"
                    };

                    var fileName = $"reg_{DateTime.UtcNow.Ticks}{ext}";
                    var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var dir = Path.Combine(webRoot, "avatars");
                    Directory.CreateDirectory(dir);
                    var path = Path.Combine(dir, fileName);
                    await System.IO.File.WriteAllBytesAsync(path, bytes, cancellationToken);

                    // Records are immutable by default; create a new request object with updated profile
                    var newProfile = request.Profile with { Avatar = $"/avatars/{fileName}" };
                    request = request with { Profile = newProfile };
                }
            }
            catch (FormatException)
            {
                return BadRequest("Invalid avatar base64 data");
            }

        using var response = await authClient.RegisterAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        using var response = await authClient.LoginAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest("Refresh token is required.");

        using var response = await authClient.RefreshAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("{provider}/session/{token}")]
    public async Task<IActionResult> GetProviderSessionAsync([FromRoute] string provider, [FromRoute] string token,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.GetSessionAsync(token, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("{provider}/pending/{token}")]
    public async Task<IActionResult> GetProviderPendingUserAsync([FromRoute] string provider, [FromRoute] string token,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.GetPendingUserAsync(token, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("google/authorize")]
    public async Task<IActionResult> GetGoogleAuthorizationAsync(CancellationToken cancellationToken)
    {
        using var response = await authClient.GetGoogleAuthorizationAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("google/complete")]
    public async Task<IActionResult> CompleteGoogleSignInAsync([FromBody] CompleteExternalSignInRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.CompleteGoogleSignInAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("github/authorize")]
    public async Task<IActionResult> GetGitHubAuthorizationAsync(CancellationToken cancellationToken)
    {
        using var response = await authClient.GetGitHubAuthorizationAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("github/complete")]
    public async Task<IActionResult> CompleteGitHubSignInAsync([FromBody] CompleteExternalSignInRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.CompleteGitHubSignInAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("discord/authorize")]
    public async Task<IActionResult> GetDiscordAuthorizationAsync(CancellationToken cancellationToken)
    {
        using var response = await authClient.GetDiscordAuthorizationAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("discord/complete")]
    public async Task<IActionResult> CompleteDiscordSignInAsync([FromBody] CompleteExternalSignInRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.CompleteDiscordSignInAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }
}