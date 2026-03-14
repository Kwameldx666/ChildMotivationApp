using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;
using AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;
using AuthService.Application.Features.Cache.PendingUser;
using AuthService.Application.Features.Cache.Session.Get;
using AuthService.Application.Models.Auth.Login;
using AuthService.Application.Models.User;
using Microsoft.Extensions.Logging;
using Moq;

namespace UnitTests;

public sealed class AuthHandlersTests
{
    [Fact]
    public async Task GetSessionQueryHandler_ShouldReturnFailure_WhenSessionMissing()
    {
        var store = new Mock<IOAuthSessionStore>();
        store.Setup(s => s.TakeAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExternalLoginResponse?)null);

        var handler = new GetSessionQueryHandler(store.Object);
        var result = await handler.Handle(new GetSessionQuery("missing"), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task GetPendingUserQueryHandler_ShouldReturnMappedResponse_WhenPendingUserExists()
    {
        var store = new Mock<IOAuthPendingUserStore>();
        store.Setup(s => s.GetAsync("token-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExternalPendingUserResponse("u@x.com", "User", "pic.png", "provider-id"));

        var handler = new GetPendingUserQueryHandler(store.Object);
        var result = await handler.Handle(new GetPendingUserQuery("token-1"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("u@x.com", result.Value!.Email);
        Assert.Equal("provider-id", result.Value.ProviderUserId);
    }

    [Fact]
    public async Task GetGoogleAuthorizationUrlQueryHandler_ShouldReturnFailure_WhenProviderFactoryThrows()
    {
        var stateStore = new Mock<IOAuthStateStore>();
        stateStore.Setup(s => s.CreateStateAsync(ExternalProviderType.Google, It.IsAny<CancellationToken>()))
            .ReturnsAsync("state-1");

        var factory = new Mock<IExternalAuthProviderFactory>();
        factory.Setup(f => f.GetProvider(ExternalProviderType.Google))
            .Throws(new InvalidOperationException("Provider missing"));

        var logger = new Mock<ILogger<GetGoogleAuthorizationUrlQueryHandler>>();

        var handler = new GetGoogleAuthorizationUrlQueryHandler(stateStore.Object, factory.Object, logger.Object);
        var result = await handler.Handle(new GetGoogleAuthorizationUrlQuery(), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(500, result.StatusCode);
    }

    [Fact]
    public async Task GetGitHubAuthorizationUrlQueryHandler_ShouldReturnSuccess()
    {
        var stateStore = new Mock<IOAuthStateStore>();
        stateStore.Setup(s => s.CreateStateAsync(ExternalProviderType.GitHub, It.IsAny<CancellationToken>()))
            .ReturnsAsync("state-gh");

        var provider = new Mock<IExternalAuthProvider>();
        provider.Setup(p => p.BuildAuthQuery("state-gh", It.IsAny<string[]>()))
            .Returns(new AuthorizationUrlResponse("https://github.com/login/oauth/authorize", "state-gh"));

        var factory = new Mock<IExternalAuthProviderFactory>();
        factory.Setup(f => f.GetProvider(ExternalProviderType.GitHub)).Returns(provider.Object);

        var handler = new GetGitHubAuthorizationUrlQueryHandler(stateStore.Object, factory.Object);
        var result = await handler.Handle(new GetGitHubAuthorizationUrlQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("state-gh", result.Value!.State);
    }
}
