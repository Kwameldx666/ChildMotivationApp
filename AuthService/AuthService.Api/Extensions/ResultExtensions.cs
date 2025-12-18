using AuthService.Common.ResultPattern;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Extensions;

public static class ResultExtensions
{
    public static IActionResult ToActionResult(this Result result)
    {
        if (result.IsSuccess)
        {
            if (result is IResult<object> valueResult && valueResult.Value is not null)
            {
                return new ObjectResult(valueResult.Value) { StatusCode = result.StatusCode };
            }

            return new StatusCodeResult(result.StatusCode);
        }

        return new ObjectResult(result.Error!.ToProblemDetails()) { StatusCode = result.Error!.ErrorCode };
    }

    public static ProblemDetails ToProblemDetails(this Error error)
    {
        return new ProblemDetails()
        {
            Extensions =
            {
                ["code"] = error.ErrorCode,
                ["description"] = error.ErrorDescription,
                ["impact"] = error.Impact,
                ["resolution"] = error.Resolution,
                ["errorType"] = error.ErrorType,
                ["recoverable"] = error.Recoverable
            }
        };
    }
}
