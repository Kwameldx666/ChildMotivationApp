using AiService.Application.Contracts;
using AiService.Infrastructure.Options;

namespace UnitTests;

public sealed class AiOptionsAndContractsTests
{
    [Fact]
    public void TaskSuggestionsRequest_ResolveLimit_ShouldApplyRules()
    {
        var explicitCount = new TaskSuggestionsRequest { SuggestionCount = 20 };
        var withDescription = new TaskSuggestionsRequest { TaskDescription = "Help with homework" };
        var defaults = new TaskSuggestionsRequest();

        Assert.Equal(10, explicitCount.ResolveLimit());
        Assert.Equal(1, withDescription.ResolveLimit());
        Assert.Equal(5, defaults.ResolveLimit());
    }

    [Fact]
    public void RewardSuggestionsRequest_ResolveLimit_ShouldClampToRange()
    {
        Assert.Equal(8, new RewardSuggestionsRequest { MaxSuggestions = 99 }.ResolveLimit());
        Assert.Equal(1, new RewardSuggestionsRequest { MaxSuggestions = -5 }.ResolveLimit());
        Assert.Equal(4, new RewardSuggestionsRequest().ResolveLimit());
    }

    [Fact]
    public void AiProviderOptions_ShouldResolveDefaultsAndNormalizeBaseUrl()
    {
        var options = new AiProviderOptions
        {
            BaseUrl = "https://example.ai/api",
            ApiKey = "key"
        };

        Assert.True(options.IsConfigured());
        Assert.Equal("https://example.ai/api/", options.ResolveBaseUri().ToString());
        Assert.Equal("v1/chat/completions", options.ResolveChatEndpoint());
        Assert.Equal("gpt-4o-mini", options.ResolveModel());
        Assert.Equal(0.6, options.ResolveTemperature());
        Assert.Equal(1200, options.ResolveMaxTokens());
        Assert.Equal(TimeSpan.FromSeconds(90), options.ResolveTimeout());
    }
}
