using FamilyQuest.Gateway.Application.Abstractions.Infrastructure;
using FamilyQuest.Gateway.Extensions;
using Microsoft.AspNetCore.Mvc;
using LoginRequest = FamilyQuest.Gateway.Application.Dto.Login.LoginRequest;

namespace FamilyQuest.Gateway.Controllers;

[ApiController]
[Route("family-quest/[controller]")]
public class AuthController(IAuthServiceClient authClient, CancellationToken cancellationToken) : ControllerBase
{
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await authClient.RegisterAsync(request, cancellationToken);
        return response.ToActionResult();
    }
}