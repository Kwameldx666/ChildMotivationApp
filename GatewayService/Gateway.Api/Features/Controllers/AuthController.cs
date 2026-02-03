using System.Text.Json;
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
    private const string AccessTokenCookieName = "access_token";
    private const string RefreshTokenCookieName = "refresh_token";

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
        return await ToActionResultWithAuthCookiesAsync(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest? request,
        CancellationToken cancellationToken)
    {
        var refreshToken = request?.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            Request.Cookies.TryGetValue(RefreshTokenCookieName, out refreshToken);
        }

        if (string.IsNullOrWhiteSpace(refreshToken))
            return BadRequest("Refresh token is required.");

        request = new RefreshTokenRequest { RefreshToken = refreshToken };

        using var response = await authClient.RefreshAsync(request, cancellationToken);
        return await ToActionResultWithAuthCookiesAsync(response);
    }

    [HttpGet("{provider}/session/{token}")]
    public async Task<IActionResult> GetProviderSessionAsync([FromRoute] string provider, [FromRoute] string token,
        CancellationToken cancellationToken)
    {
        using var response = await authClient.GetSessionAsync(token, cancellationToken);
        return await ToActionResultWithAuthCookiesAsync(response);
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
        return await ToActionResultWithAuthCookiesAsync(response);
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
        return await ToActionResultWithAuthCookiesAsync(response);
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
        return await ToActionResultWithAuthCookiesAsync(response);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        ClearAuthCookies();
        return Ok();
    }

    private async Task<IActionResult> ToActionResultWithAuthCookiesAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode && !string.IsNullOrWhiteSpace(content))
        {
            if (TryExtractTokens(content, out var accessToken, out var refreshToken))
            {
                SetAuthCookies(accessToken, refreshToken);
            }
        }

        return new ContentResult
        {
            StatusCode = (int)response.StatusCode,
            Content = content,
            ContentType = response.Content.Headers.ContentType?.ToString() ?? "application/json"
        };
    }

    private bool TryExtractTokens(string content, out string accessToken, out string refreshToken)
    {
        accessToken = string.Empty;
        refreshToken = string.Empty;

        try
        {
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            accessToken = TryReadToken(root, "accessToken") ?? TryReadToken(root, "AccessToken") ?? string.Empty;
            refreshToken = TryReadToken(root, "refreshToken") ?? TryReadToken(root, "RefreshToken") ?? string.Empty;

            return !string.IsNullOrWhiteSpace(accessToken) && !string.IsNullOrWhiteSpace(refreshToken);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string? TryReadToken(JsonElement root, string propertyName)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(propertyName, out var value)) return null;
        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !env.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            IsEssential = true
        };

        Response.Cookies.Append(AccessTokenCookieName, accessToken, cookieOptions);
        Response.Cookies.Append(RefreshTokenCookieName, refreshToken, cookieOptions);
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(AccessTokenCookieName, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions { Path = "/" });
    }
}