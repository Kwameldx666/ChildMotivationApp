using System.Net;

namespace AuthService.Common.ResultPattern;

public interface IFailureResult<out TSelf>
    where TSelf : IResult
{
    static abstract TSelf Failure(HttpStatusCode statusCode, Error error);
}
