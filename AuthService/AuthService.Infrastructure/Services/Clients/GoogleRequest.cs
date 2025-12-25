namespace AuthService.Infrastructure.Services.Clients;

file record GoogleRequest(
    string Code,
    string ClientId,
    string ClientSecret,
    string RedirectUri,
    string GrantType = "authorization_code");