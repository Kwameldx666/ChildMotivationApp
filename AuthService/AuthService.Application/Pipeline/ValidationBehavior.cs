using System.Net;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Pipeline;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
    where TResponse : IResult, IFailureResult<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    private readonly ILogger<ValidationBehavior<TRequest, TResponse>> _logger;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators, ILogger<ValidationBehavior<TRequest, TResponse>> logger)
    {
        _validators = validators;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("ValidationBehavior: Handling request {RequestType}", typeof(TRequest).Name);
        
        if (!_validators.Any())
        {
            _logger.LogInformation("ValidationBehavior: No validators, calling next");
            try
            {
                var result = await next();
                _logger.LogInformation("ValidationBehavior: next() returned successfully for {RequestType}", typeof(TRequest).Name);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ValidationBehavior: next() threw exception for {RequestType}: {Message}", typeof(TRequest).Name, ex.Message);
                throw;
            }
        }

        var context = new ValidationContext<TRequest>(request);

        _logger.LogInformation("ValidationBehavior: Running {ValidatorCount} validators", _validators.Count());
        var failures = (await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(r => r.Errors)
            .Where(e => e is not null)
            .ToList();

        if (!failures.Any())
        {
            _logger.LogInformation("ValidationBehavior: Validation passed, calling next");
            try
            {
                var result = await next();
                _logger.LogInformation("ValidationBehavior: next() returned successfully after validation for {RequestType}", typeof(TRequest).Name);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ValidationBehavior: next() threw exception after validation for {RequestType}: {Message}", typeof(TRequest).Name, ex.Message);
                throw;
            }
        }

        _logger.LogWarning("ValidationBehavior: Validation failed with {FailureCount} errors", failures.Count);
        var errorMessage = string.Join(", ", failures.Select(e => e.ErrorMessage).Distinct().ToList());
        var error = DefaultErrors.BadRequest(errorMessage);

        return TResponse.Failure(HttpStatusCode.BadRequest, error);
    }
}