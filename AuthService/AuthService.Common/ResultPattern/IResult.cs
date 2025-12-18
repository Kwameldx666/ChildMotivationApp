namespace AuthService.Common.ResultPattern;

public interface IResult
{
    bool IsSuccess { get; }
    int StatusCode { get; }
    Error? Error { get; }
}

public interface IResult<out T> : IResult
{
    T? Value { get; }
}

