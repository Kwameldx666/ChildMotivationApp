using System.Net;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using FluentValidation;
using MediatR;

namespace AuthService.Application.Pipeline;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
    where TResponse : IResult, IFailureResult<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any()) return await next(cancellationToken);

        var context = new ValidationContext<TRequest>(request);

        var failures = (await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(r => r.Errors)
            .Where(e => e is not null)
            .ToList();

        if (!failures.Any()) return await next(cancellationToken);

        var errorMessage = string.Join(", ", failures.Select(e => e.ErrorMessage).Distinct().ToList());
        var error = DefaultErrors.BadRequest(errorMessage);

        return TResponse.Failure(HttpStatusCode.BadRequest, error);
    }
}