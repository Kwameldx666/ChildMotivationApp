using System.Net;

namespace AuthService.Common.ResultPattern;

public class Result : IResult, IFailureResult<Result>
{
    public bool IsSuccess { get; }
    public int StatusCode { get; }
    public Error? Error { get; }

    protected Result(bool isSuccess, int statusCode, Error? error)
    {
        IsSuccess = isSuccess;
        StatusCode = statusCode;
        Error = error;

        if ((isSuccess && error is not null && !ReferenceEquals(error, Error.None)) || (!isSuccess && error is null))
            throw new InvalidOperationException("Invalid result state.");
    }

    public static Result Success(HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        return new Result(true, (int)statusCode, Error.None);
    }

    public static Result Failure(HttpStatusCode statusCode, Error error)
    {
        return new Result(false, (int)statusCode, error);
    }

    public static Result<T> Failure<T>(HttpStatusCode statusCode, Error error)
    {
        return new Result<T>(false, (int)statusCode, error, default);
    }

    public static Result<T> Failure<T>(int statusCode, Error error)
    {
        return new Result<T>(false, statusCode, error, default);
    }
}

public class Result<T> : Result, IResult<T>, IFailureResult<Result<T>>
{
    public T? Value { get; }

    internal Result(bool isSuccess, int statusCode, Error? error, T? value) : base(isSuccess, statusCode, error)
    {
        Value = value;
    }

    public new static Result<T> Failure(HttpStatusCode statusCode, Error error)
    {
        return Result.Failure<T>(statusCode, error);
    }

    public static Result<T> Success(T value, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        return new Result<T>(true, (int)statusCode, Error.None, value);
    }
}