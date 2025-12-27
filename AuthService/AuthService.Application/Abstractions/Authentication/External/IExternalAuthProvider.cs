namespace AuthService.Application.Dto.User;

public interface IExternalAuthProvider
{
    Task<HttpResponseMessage> RequestAccessToken(string code, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RequestUserInfo(string accessToken, CancellationToken cancellationToken);
}