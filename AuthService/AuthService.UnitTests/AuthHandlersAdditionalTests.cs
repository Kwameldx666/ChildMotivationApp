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

namespace AuthService.UnitTests;

public sealed class AuthHandlersAdditionalTests
{
    [Fact]
    public async Task GetSessionQueryHandler_ShouldReturnSuccess_WhenSessionExists()
    {
        var session = new ExternalLoginResponse(
            "access",
            "refresh",
            new AuthUserDto("u1", "u1@example.com", "John", "Doe"),
            new UserProfileDto("John", "Doe", "avatar.png", "Parent", 35),
            new FamilyDto("FAMILY", "Doe Family", "lion"));

        var store = new Mock<IOAuthSessionStore>();
        store.Setup(s => s.TakeAsync("token", It.IsAny<CancellationToken>())).ReturnsAsync(session);

        var handler = new GetSessionQueryHandler(store.Object);
        var result = await handler.Handle(new GetSessionQuery("token"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("u1@example.com", result.Value!.User.Email);
    }

    [Fact]
    public async Task GetPendingUserQueryHandler_ShouldReturnFailure_WhenTokenMissing()
    {
        var store = new Mock<IOAuthPendingUserStore>();
        store.Setup(s => s.GetAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExternalPendingUserResponse?)null);

        var handler = new GetPendingUserQueryHandler(store.Object);
        var result = await handler.Handle(new GetPendingUserQuery("missing"), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task GetGoogleAuthorizationUrlQueryHandler_ShouldReturnProviderUrl_WhenSuccess()
    {
        var stateStore = new Mock<IOAuthStateStore>();
        stateStore.Setup(s => s.CreateStateAsync(ExternalProviderType.Google, It.IsAny<CancellationToken>()))
            .ReturnsAsync("google-state");

        var provider = new Mock<IExternalAuthProvider>();
        provider.Setup(p => p.BuildAuthQuery("google-state", It.IsAny<string[]>()))
            .Returns(new AuthorizationUrlResponse("https://accounts.google.com/o/oauth2/v2/auth", "google-state"));

        var factory = new Mock<IExternalAuthProviderFactory>();
        factory.Setup(f => f.GetProvider(ExternalProviderType.Google)).Returns(provider.Object);

        var logger = new Mock<ILogger<GetGoogleAuthorizationUrlQueryHandler>>();
        var handler = new GetGoogleAuthorizationUrlQueryHandler(stateStore.Object, factory.Object, logger.Object);

        var result = await handler.Handle(new GetGoogleAuthorizationUrlQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("google-state", result.Value!.State);
        Assert.StartsWith("https://accounts.google.com/", result.Value.AuthorizationUrl, StringComparison.Ordinal);
        provider.Verify(p => p.BuildAuthQuery("google-state", It.Is<string[]>(scopes => scopes.Length > 0)), Times.Once);
    }

    [Fact]
    public async Task GetGitHubAuthorizationUrlQueryHandler_ShouldBubbleException_WhenProviderFactoryFails()
    {
        var stateStore = new Mock<IOAuthStateStore>();
        stateStore.Setup(s => s.CreateStateAsync(ExternalProviderType.GitHub, It.IsAny<CancellationToken>()))
            .ReturnsAsync("gh-state");

        var factory = new Mock<IExternalAuthProviderFactory>();
        factory.Setup(f => f.GetProvider(ExternalProviderType.GitHub))
            .Throws(new InvalidOperationException("provider unavailable"));

        var handler = new GetGitHubAuthorizationUrlQueryHandler(stateStore.Object, factory.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new GetGitHubAuthorizationUrlQuery(), CancellationToken.None));
    }
}
