using AuthService.Common.ResultPattern;

namespace AuthService.Common.Constants.Errors;

public static class AuthorizationErrors
{
    public static Error Unauthorized(string description) => new Error
    {
        ErrorCode = 401,
        ErrorType = "Unauthorized",
        ErrorDescription = description,
        Impact = "The request cannot be processed without valid credentials.",
        Resolution = "Ensure the request is authenticated.",
        Recoverable = true
    };

    public static Error Conflict(string description) => new Error
    {
        ErrorCode = 409,
        ErrorType = "Conflict",
        ErrorDescription = description,
        Impact = "The request conflicts with the current state of the resource.",
        Resolution = "Resolve the conflict and retry the request.",
        Recoverable = true
    };

    public static Error NotFound(string description) => new Error()
    {
        ErrorCode = 404,
        ErrorType = "NotFound",
        ErrorDescription = description,
        Impact = "User not found.",
        Resolution = "Ensure the credentials are correct.",
        Recoverable = true
    };
}