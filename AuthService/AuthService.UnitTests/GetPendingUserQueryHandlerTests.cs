using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Cache.PendingUser;
using Moq;

namespace AuthService.UnitTests;

public sealed class GetPendingUserQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnSuccess_WhenPendingUserExists()
    {
        var store = new Mock<IOAuthPendingUserStore>();
        store.Setup(x => x.GetAsync("token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExternalPendingUserResponse("test@ex.com", "Test", "pic", "provider-1"));

        var handler = new GetPendingUserQueryHandler(store.Object);

        var result = await handler.Handle(new GetPendingUserQuery("token"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("test@ex.com", result.Value!.Email);
    }
}
