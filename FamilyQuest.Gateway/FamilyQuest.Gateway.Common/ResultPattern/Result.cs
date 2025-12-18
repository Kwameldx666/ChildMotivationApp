using System.Net;
using FamilyQuest.Gateway.Application.Abstractions.Common.Result;

namespace FamilyQuest.Gateway.Common.ResultPattern;

public class Result : IResult
{
    public bool IsSuccess { get; }
    public int StatusCode { get; }
    public Error? Error { get; }

    protected Result(bool isSuccess, int statusCode, Error? error)
    {
        IsSuccess = isSuccess;
        StatusCode = statusCode;
        Error = error;

        if ((isSuccess && error != null) || (!isSuccess && error == null))
            throw new InvalidOperationException("Invalid Result state.");
    }

    public static Result Success(int statusCode = (int)HttpStatusCode.OK) => new(true, statusCode, Error.None);

    public static Result<T> Failure<T>(int statusCode, Error error) => new(false, statusCode, error, default);
}

public class Result<T> : Result, IResult<T>
{
    public T? Value { get; }

    internal Result(bool isSuccess, int statusCode, Error? error, T? value)
        : base(isSuccess, statusCode, error)
    {
        Value = value;
    }

    public static Result<T> Success(T value, int statusCode = (int)HttpStatusCode.OK) =>
        new(true, statusCode, Error.None, value);
}