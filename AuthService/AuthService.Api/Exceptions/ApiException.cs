namespace AuthService.Exceptions;

public class ApiException(int code, string? message = null) : Exception(message)
{
    public int Code { get; set; } = code;

    public static ApiException Unauthorized()
    {
        return new ApiException(StatusCodes.Status401Unauthorized, "Unauthorized");
    }
}