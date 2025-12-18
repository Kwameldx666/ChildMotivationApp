using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using AuthService.Common.ResultPattern;
using AuthService.Extensions;

namespace AuthService.Controllers;

[ApiController]
[Route("auth-service/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    public Task<IActionResult> RegisterUserAsync([FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        Result<object> result = Result<object>.Success(request, StatusCodes.Status201Created);
        return Task.FromResult(result.ToActionResult());
    }
}
