namespace AuthService.Application.Features.Authentication.External.Shared.Dto;

public record AuthorizationResponse(string AuthorizationUrl, string State);