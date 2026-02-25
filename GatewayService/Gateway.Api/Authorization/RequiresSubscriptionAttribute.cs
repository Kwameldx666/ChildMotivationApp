using System.Security.Claims;
using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;

namespace Gateway.Authorization;

/// <summary>
/// Subscription feature names matching the UserSubscription entity flags.
/// </summary>
public static class SubscriptionFeatures
{
    public const string AiAssistant = "hasAIAssistant";
    public const string AdvancedAnalytics = "hasAdvancedAnalytics";
    public const string CustomRewards = "hasCustomRewards";
    public const string PrioritySupport = "hasPrioritySupport";
    public const string FamilySharing = "hasFamilySharing";
    public const string OfflineMode = "hasOfflineMode";
}

/// <summary>
/// Action filter attribute that enforces subscription feature requirements.
/// Apply to controller actions that should be restricted by subscription tier.
/// <example>
/// [RequiresSubscription(SubscriptionFeatures.AiAssistant)]
/// </example>
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequiresSubscriptionAttribute : Attribute, IFilterFactory
{
    public string Feature { get; }
    public bool IsReusable => false;        

    public RequiresSubscriptionAttribute(string feature)
    {
        Feature = feature;
    }

    public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
    {
        return new RequiresSubscriptionFilter(
            Feature,
            serviceProvider.GetRequiredService<IUserServiceClient>(),
            serviceProvider.GetRequiredService<IMemoryCache>(),
            serviceProvider.GetRequiredService<ILogger<RequiresSubscriptionFilter>>()
        );
    }
}

internal sealed class RequiresSubscriptionFilter(
    string feature,
    IUserServiceClient userServiceClient,
    IMemoryCache cache,
    ILogger<RequiresSubscriptionFilter> logger) : IAsyncActionFilter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2);

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // TODO: Subscription gating temporarily disabled — re-enable after review
        await next();
    }

    private async Task<JsonElement?> GetSubscriptionCachedAsync(string userId, CancellationToken ct)
    {
        var cacheKey = $"subscription:{userId}";
        if (cache.TryGetValue(cacheKey, out JsonElement cached))
            return cached;

        using var response = await userServiceClient.GetCurrentSubscriptionAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Failed to get subscription for user {UserId}: {StatusCode}", userId,
                response.StatusCode);
            return null;
        }

        var body = await response.Content.ReadAsStringAsync(ct);
        var doc = JsonDocument.Parse(body);
        var element = doc.RootElement.Clone();

        cache.Set(cacheKey, element, CacheDuration);
        return element;
    }

    private static bool CheckFeatureAccess(JsonElement? subscription, string featureName)
    {
        if (subscription == null) return false;

        var sub = subscription.Value;
        if (sub.TryGetProperty(featureName, out var prop))
            return prop.GetBoolean();

        // camelCase fallback (e.g., hasAIAssistant → hasAiAssistant)
        var camelCase = char.ToLowerInvariant(featureName[0]) + featureName[1..];
        if (sub.TryGetProperty(camelCase, out var camelProp))
            return camelProp.GetBoolean();

        return false;
    }

    private static JsonResult CreateForbiddenResult(string featureName, string currentTier)
    {
        return new JsonResult(new
        {
            type = "subscription_required",
            title = "Subscription upgrade required",
            detail = $"Feature '{featureName}' is not available on the '{currentTier}' plan.",
            feature = featureName,
            currentTier,
            status = 403
        })
        {
            StatusCode = 403
        };
    }
}
