using Gateway.Common.ResultPattern;
using Gateway.Exceptions;
using Gateway.Extensions;
using Microsoft.AspNetCore.Diagnostics;

namespace Gateway.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    public ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception,
        CancellationToken cancellationToken)
    {
        var error = exception switch
        {
            UnauthorizedException => DefaultErrors.Unauthorized(exception.Message),
            _ => DefaultErrors.InternalServerError(exception.Message)
        };

        httpContext.Response.StatusCode = error.ErrorCode;
        httpContext.Response.WriteAsJsonAsync(error.ToProblemDetails(), cancellationToken);
        return new ValueTask<bool>(true);
    }
}