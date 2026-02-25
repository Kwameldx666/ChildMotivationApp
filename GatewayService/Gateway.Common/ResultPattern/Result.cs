using System.Net;

namespace Gateway.Common.ResultPattern;

public class Result : IResult
{
    protected Result(bool isSuccess, int statusCode, Error? error)
    {
        IsSuccess = isSuccess;
        StatusCode = statusCode;
        Error = error;

        if ((isSuccess && error is not null && !ReferenceEquals(error, Error.None)) || (!isSuccess && error is null))
            throw new InvalidOperationException("Invalid result state.");
    }

    public bool IsSuccess { get; }
    public int StatusCode { get; }
    public Error? Error { get; }

    public static Result Success(int statusCode = (int)HttpStatusCode.OK)
    {
        return new Result(true, statusCode, Error.None);
    }

    public static Result Failure(int statusCode, Error error)
    {
        return new Result(false, statusCode, error);
    }

    public static Result<T> Failure<T>(int statusCode, Error error)
    {
        return new Result<T>(false, statusCode, error, default);
    }
}

public class Result<T> : Result, IResult<T>
{
    internal Result(bool isSuccess, int statusCode, Error? error, T? value) : base(isSuccess, statusCode, error)
    {
        Value = value;
    }

    public T? Value { get; }

    public static Result<T> Success(T value, int statusCode = (int)HttpStatusCode.OK)
    {
        return new Result<T>(true, statusCode, Error.None, value);
    }
}