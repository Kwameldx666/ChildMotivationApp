using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Extensions;
using Microsoft.AspNetCore.Diagnostics;

namespace AuthService.Middlewares;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        Error error = exception switch
        {
            _ => DefaultErrors.InternalServerError(exception.Message)
        };

        context.Response.StatusCode = error.ErrorCode;
        await context.Response.WriteAsJsonAsync(error.ToProblemDetails(), cancellationToken: cancellationToken);

        return true;
    }
}