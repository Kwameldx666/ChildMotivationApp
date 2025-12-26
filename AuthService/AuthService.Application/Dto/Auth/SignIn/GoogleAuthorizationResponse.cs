namespace AuthService.Application.Dto.Auth.SignIn;

public record AuthorizationResponse(string AuthorizationUrl, string State);
