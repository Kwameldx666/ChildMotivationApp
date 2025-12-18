using FamilyQuest.Gateway.Common.ResultPattern;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuest.Gateway.Extensions;

public static class ResultExtensions
{
    public static IActionResult ToActionResult(this Result result)
    {
        return result.IsSuccess
            ? new StatusCodeResult(result.StatusCode )
            : new ObjectResult(result.Error!.ToProblemDetails()) { StatusCode = result.Error!.ErrorCode };
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