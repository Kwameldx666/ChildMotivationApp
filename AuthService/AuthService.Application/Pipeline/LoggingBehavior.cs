using MediatR;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Pipeline;

public class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        logger.LogDebug("Handling {RequestName}", requestName);

        var response = await next();

        logger.LogDebug("Handled {RequestName}", requestName);
        return response;
    }
}
