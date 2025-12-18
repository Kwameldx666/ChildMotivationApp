using System.Net;
using FamilyQuest.Gateway.Common.ResultPattern;

namespace FamilyQuest.Gateway.Application.Abstractions.Common.Result;

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