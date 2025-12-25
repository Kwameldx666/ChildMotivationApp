using AuthService.Common.ResultPattern;

namespace AuthService.Common.Constants.Errors;

public static class DefaultErrors
{
    public static Error BadRequest(string description)
    {
        return new Error
        {
            ErrorCode = 400,
            ErrorType = "BadRequest",
            ErrorDescription = description,
            Impact = "The request contains invalid data.",
            Resolution = "Correct the request data and try again.",
            Recoverable = true
        };
    }

    public static Error NotFound(string description)
    {
        return new Error
        {
            ErrorCode = 404,
            ErrorType = "NotFound",
            ErrorDescription = description,
            Impact = "The requested resource was not found.",
            Resolution = "Verify the resource identifier and try again.",
            Recoverable = true
        };
    }

    public static Error InternalServerError(string description)
    {
        return new Error
        {
            ErrorCode = 500,
            ErrorType = "InternalServerError",
            ErrorDescription = description,
            Impact = "An internal server error occurred.",
            Resolution = "Try again later or contact support if the issue persists.",
            Recoverable = true
        };
    }

    public static Error Conflict(string description)
    {
        return new Error
        {
            ErrorCode = 409,
            ErrorType = "Conflict",
            ErrorDescription = description,
            Impact = "The request could not be completed due to a conflict with the current state of the resource.",
            Resolution = "Verify the current state and adjust your request before retrying.",
            Recoverable = true
        };
    }
}