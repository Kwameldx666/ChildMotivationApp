using AiService.Application.Contracts;
using AiService.Infrastructure.Options;

namespace AiService.UnitTests;

public sealed class AiContractsTests
{
    [Fact]
    public void TaskSuggestionsRequest_ResolveLimit_ShouldUseDefaultsAndClamp()
    {
        var defaultReq = new TaskSuggestionsRequest();
        var clampedReq = new TaskSuggestionsRequest { SuggestionCount = 100 };

        Assert.Equal(5, defaultReq.ResolveLimit());
        Assert.Equal(10, clampedReq.ResolveLimit());
    }

    [Fact]
    public void AiProviderOptions_ResolveBaseUri_ShouldAppendTrailingSlash()
    {
        var options = new AiProviderOptions { BaseUrl = "https://api.example.com/v1" };

        var baseUri = options.ResolveBaseUri();

        Assert.Equal("https://api.example.com/v1/", baseUri.ToString());
    }
}
