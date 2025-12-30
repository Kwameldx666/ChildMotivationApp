using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuthService.Controllers;

[Route("auth-service/debug")]
public class DebugController(IServiceProvider serviceProvider, ILogger<DebugController> logger) : ControllerBase
{
    [HttpGet("state")]
    public async Task<IActionResult> StateExists([FromQuery] string state, [FromQuery] string provider = "discord")
    {
        if (string.IsNullOrWhiteSpace(state))
            return BadRequest(new { found = false, message = "state is empty" });

        var key = BuildKey(state, provider);
        var distributed = serviceProvider.GetService(typeof(IDistributedCache)) as IDistributedCache;
        var foundDistributed = distributed != null ? await distributed.GetStringAsync(key) is not null : false;
        var found = foundDistributed;

        return Ok(new
        {
            found,
            provider,
            foundDistributed,
            statePreview = state.Length > 8 ? state.Substring(0, 8) : state,
            keyPreview = key.Length > 12 ? key.Substring(0, 12) : key
        });
    }

    private static string BuildKey(string state, string provider)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(state));
        var baseKey = Convert.ToBase64String(hash);
        return provider.ToLowerInvariant() switch
        {
            "discord" => "discord-state:" + baseKey,
            "github" => "github-state:" + baseKey,
            "google" => "google-state:" + baseKey,
            _ => throw new ArgumentOutOfRangeException(nameof(provider), "Unsupported provider")
        };
    }
}