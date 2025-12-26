namespace AuthService.Application.Abstractions.Infrastructure.Clients;

public interface IGoogleServiceClient
{
    Task<HttpResponseMessage> RequestAccessToken(string code, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RequestUserInfo(string accessToken, CancellationToken cancellationToken);
}