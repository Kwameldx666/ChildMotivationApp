using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Diagnostics.CodeAnalysis;
using AiService.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiService.Infrastructure.Clients;

[ExcludeFromCodeCoverage]
internal sealed class OpenAiClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenAiClient> _logger;
    private readonly IOptionsMonitor<AiProviderOptions> _optionsMonitor;

    public OpenAiClient(HttpClient httpClient, IOptionsMonitor<AiProviderOptions> optionsMonitor,
        ILogger<OpenAiClient> logger)
    {
        _httpClient = httpClient;
        _optionsMonitor = optionsMonitor;
        _logger = logger;
    }

    public async Task<string> GetCompletionAsync(IReadOnlyList<OpenAiMessage> messages,
        CancellationToken cancellationToken)
    {
        var options = _optionsMonitor.CurrentValue;
        if (string.IsNullOrWhiteSpace(options.ApiKey))
            throw new InvalidOperationException("OpenAI API key is not configured (AiProvider__ApiKey).");

        var requestPayload = new OpenAiChatRequest(
            options.ResolveModel(),
            options.ResolveTemperature(),
            options.ResolveMaxTokens(),
            messages.Select(static message => new OpenAiChatMessage(message.Role, message.Content)).ToArray());

        using var request = new HttpRequestMessage(HttpMethod.Post, options.ResolveChatEndpoint());
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);

        if (!string.IsNullOrWhiteSpace(options.Organization))
            request.Headers.TryAddWithoutValidation("OpenAI-Organization", options.Organization);

        request.Content = JsonContent.Create(requestPayload, options: SerializerOptions);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var payload = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("OpenAI request failed with status {StatusCode}: {Body}", response.StatusCode, payload);
            response.EnsureSuccessStatusCode();
        }

        using var document = JsonDocument.Parse(payload);
        if (document.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0 &&
            choices[0].TryGetProperty("message", out var messageElement) &&
            messageElement.TryGetProperty("content", out var contentElement))
            return contentElement.GetString() ?? string.Empty;

        _logger.LogWarning("OpenAI payload has unexpected format: {Payload}", payload);
        return string.Empty;
    }
}

[ExcludeFromCodeCoverage]
internal sealed record OpenAiMessage(string Role, string Content)
{
    public static OpenAiMessage System(string content)
    {
        return new OpenAiMessage("system", content);
    }

    public static OpenAiMessage User(string content)
    {
        return new OpenAiMessage("user", content);
    }

    public static OpenAiMessage Assistant(string content)
    {
        return new OpenAiMessage("assistant", content);
    }
}

[ExcludeFromCodeCoverage]
internal sealed record OpenAiChatRequest(
    string Model,
    double Temperature,
    [property: JsonPropertyName("max_tokens")]
    int MaxTokens,
    IReadOnlyCollection<OpenAiChatMessage> Messages);

[ExcludeFromCodeCoverage]
internal sealed record OpenAiChatMessage(string Role, string Content);