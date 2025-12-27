namespace AuthService.Common.ResultPattern;

public class Error
{
    public static readonly Error None = new()
        { ErrorType = "None", ErrorDescription = "", Impact = "", Resolution = "" };

    public int ErrorCode { get; init; }
    public required string ErrorType { get; init; }

    public required string Impact { get; init; }
    public required string Resolution { get; init; }
    public required string ErrorDescription { get; init; }

    public bool Recoverable { get; init; }
}