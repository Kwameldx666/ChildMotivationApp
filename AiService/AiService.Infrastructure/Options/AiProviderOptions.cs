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

    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(ApiKey);
    }

    public Uri ResolveBaseUri()
    {
        var candidate = string.IsNullOrWhiteSpace(BaseUrl) ? "https://api.gptgod.online/v1/" : BaseUrl;
        if (!candidate!.EndsWith("/", StringComparison.Ordinal)) candidate += "/";

        return new Uri(candidate, UriKind.Absolute);
    }

    public string ResolveChatEndpoint()
    {
        return string.IsNullOrWhiteSpace(ChatEndpoint) ? "v1/chat/completions" : ChatEndpoint!;
    }

    public string ResolveModel()
    {
        return string.IsNullOrWhiteSpace(Model) ? "gpt-4o-mini" : Model!;
    }

    public double ResolveTemperature()
    {
        return Temperature is > 0 ? Temperature!.Value : 0.6;
    }

    public int ResolveMaxTokens()
    {
        return MaxTokens is > 0 ? MaxTokens!.Value : 1200;
    }

    public TimeSpan ResolveTimeout()
    {
        return TimeSpan.FromSeconds(TimeoutSeconds is > 0 ? TimeoutSeconds!.Value : 90);
    }
}