using System;

namespace AiService.Infrastructure.Options;

public sealed class AiProviderOptions
{
    public const string SectionName = "AiProvider";

    public string Provider { get; set; } = "OpenAI";
    public string? ApiKey { get; set; }
    public string? Organization { get; set; }
    public string? BaseUrl { get; set; }
    public string? ChatEndpoint { get; set; }
    public string? Model { get; set; }
    public double? Temperature { get; set; }
    public int? MaxTokens { get; set; }
    public int? TimeoutSeconds { get; set; }

    public bool IsConfigured() => !string.IsNullOrWhiteSpace(ApiKey);

    public Uri ResolveBaseUri()
    {
        var candidate = string.IsNullOrWhiteSpace(BaseUrl) ? "https://api.openai.com/" : BaseUrl;
        if (!candidate!.EndsWith("/", StringComparison.Ordinal))
        {
            candidate += "/";
        }

        return new Uri(candidate, UriKind.Absolute);
    }

    public string ResolveChatEndpoint() => string.IsNullOrWhiteSpace(ChatEndpoint) ? "v1/chat/completions" : ChatEndpoint!;
    public string ResolveModel() => string.IsNullOrWhiteSpace(Model) ? "gpt-4o-mini" : Model!;
    public double ResolveTemperature() => Temperature is > 0 ? Temperature!.Value : 0.6;
    public int ResolveMaxTokens() => MaxTokens is > 0 ? MaxTokens!.Value : 700;
    public TimeSpan ResolveTimeout() => TimeSpan.FromSeconds(TimeoutSeconds is > 0 ? TimeoutSeconds!.Value : 45);
}
