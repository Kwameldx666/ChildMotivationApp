namespace Gateway.Exceptions;

public class UnauthorizedException(string? message = "Unauthorized") : ApiException(message);