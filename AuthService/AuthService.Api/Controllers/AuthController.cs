using AuthService.Application.Features.Authentication.RegisterUser;
using Microsoft.AspNetCore.Mvc;
using AuthService.Extensions;
using MediatR;

namespace AuthService.Controllers;

[ApiController]
[Route("auth-service/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator  _mediator;
    
    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }
    [HttpPost("register")]
    public async Task<IActionResult> RegisterUserAsync([FromBody] RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        var result = await  _mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }
}
