using AuthService.Common.Constants.Errors;
using AuthService.Extensions;
using Microsoft.AspNetCore.Diagnostics;

namespace AuthService.Middlewares;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception,
        CancellationToken cancellationToken)
    {
        var error = exception switch
        {
            ApplicationException => AuthorizationErrors.Unauthorized(exception.Message),
            _ => DefaultErrors.InternalServerError(exception.Message)
        };

        context.Response.StatusCode = error.ErrorCode;
        await context.Response.WriteAsJsonAsync(error.ToProblemDetails(), cancellationToken);

        return true;
    }
}