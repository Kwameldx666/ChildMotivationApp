using Gateway.Common.ResultPattern;
using Gateway.Extensions;
using Microsoft.AspNetCore.Diagnostics;

namespace Gateway.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    public ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        Error error = exception switch
        {
            _ => DefaultErrors.InternalServerError(exception.Message)
        };

        httpContext.Response.StatusCode = error.ErrorCode;
        httpContext.Response.WriteAsJsonAsync(error.ToProblemDetails(), cancellationToken: cancellationToken);
        return new ValueTask<bool>(false);
    }
}