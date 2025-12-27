namespace AuthService.Application.Features.Authentication.SignIn.Shared.Dto;

public record AuthorizationResponse(string AuthorizationUrl, string State);