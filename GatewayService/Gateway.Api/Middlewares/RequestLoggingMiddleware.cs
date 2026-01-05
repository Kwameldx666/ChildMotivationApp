using System.Diagnostics;

namespace Gateway.Middlewares;

public sealed class RequestLoggingMiddleware
{
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = context.Items["X-Correlation-Id"]?.ToString() ?? "N/A";

        try
        {
            _logger.LogInformation(
                "Incoming request: {Method} {Path} | Correlation: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                correlationId);

            await _next(context);

            stopwatch.Stop();

            _logger.LogInformation(
                "Completed request: {Method} {Path} | Status: {StatusCode} | Duration: {Duration}ms | Correlation: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds,
                correlationId);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "Request failed: {Method} {Path} | Duration: {Duration}ms | Correlation: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds,
                correlationId);

            throw;
        }
    }
}