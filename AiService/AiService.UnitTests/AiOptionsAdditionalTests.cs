using AiService.Application.Contracts;
using AiService.Infrastructure.Options;

namespace AiService.UnitTests;

public sealed class AiOptionsAdditionalTests
{
    [Fact]
    public void IsConfigured_ShouldReturnFalse_WhenApiKeyMissing()
    {
        var options = new AiProviderOptions { ApiKey = "   " };

        Assert.False(options.IsConfigured());
    }

    [Fact]
    public void ResolveBaseUri_ShouldUseDefault_WhenBaseUrlNotSet()
    {
        var options = new AiProviderOptions { ApiKey = "key" };

        var uri = options.ResolveBaseUri();

        Assert.Equal("https://api.gptgod.online/v1/", uri.ToString());
    }

    [Theory]
    [InlineData(0, 0.6)]
    [InlineData(-1, 0.6)]
    [InlineData(0.8, 0.8)]
    public void ResolveTemperature_ShouldUseFallbackOrCustom(double input, double expected)
    {
        var options = new AiProviderOptions { Temperature = input };

        Assert.Equal(expected, options.ResolveTemperature(), 2);
    }

    [Theory]
    [InlineData(null, 1200)]
    [InlineData(0, 1200)]
    [InlineData(2500, 2500)]
    public void ResolveMaxTokens_ShouldUseFallbackOrCustom(int? input, int expected)
    {
        var options = new AiProviderOptions { MaxTokens = input };

        Assert.Equal(expected, options.ResolveMaxTokens());
    }

    [Theory]
    [InlineData(null, 90)]
    [InlineData(0, 90)]
    [InlineData(15, 15)]
    public void ResolveTimeout_ShouldUseFallbackOrCustom(int? input, int expectedSeconds)
    {
        var options = new AiProviderOptions { TimeoutSeconds = input };

        Assert.Equal(TimeSpan.FromSeconds(expectedSeconds), options.ResolveTimeout());
    }

    [Fact]
    public void TaskSuggestionsRequest_ResolveLimit_ShouldClampLowExplicitCountToOne()
    {
        var request = new TaskSuggestionsRequest { SuggestionCount = -2 };

        Assert.Equal(1, request.ResolveLimit());
    }

    [Fact]
    public void ResolveEndpointAndModel_ShouldReturnCustomValues_WhenConfigured()
    {
        var options = new AiProviderOptions
        {
            ChatEndpoint = "chat/custom",
            Model = "custom-model"
        };

        Assert.Equal("chat/custom", options.ResolveChatEndpoint());
        Assert.Equal("custom-model", options.ResolveModel());
    }
}
