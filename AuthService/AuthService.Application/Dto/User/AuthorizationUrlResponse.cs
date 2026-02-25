namespace AuthService.Application.Dto.User;

public record AuthorizationUrlResponse(string AuthorizationUrl, string State);