namespace AuthService.Application.Dto.Token;

public sealed record ExternalAuthToken(
    string AccessToken,
    string? IdToken = null!
);