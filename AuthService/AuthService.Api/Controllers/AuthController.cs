using AuthService.Application.Features.Authentication.Password.ChangeEmail;
using AuthService.Application.Features.Authentication.Password.ChangePassword;
using AuthService.Application.Features.Authentication.Password.CompleteChildSetup;
using AuthService.Application.Features.Authentication.Password.ConfirmEmail;
using AuthService.Application.Features.Authentication.Password.Login;
using AuthService.Application.Features.Authentication.Password.RefreshToken;
using AuthService.Application.Features.Authentication.Password.Register;
using AuthService.Application.Features.Authentication.Password.RegisterChild;
using AuthService.Application.Features.Authentication.Password.ResetChildPassword;
using AuthService.Application.Features.Authentication.Password.ResendConfirmation;
using AuthService.Application.Features.Authentication.Password.RevokeToken;
using AuthService.Application.Features.Cache.PendingUser;
using AuthService.Application.Features.Cache.Session.Get;
using AuthService.Domain.Entities;
using AuthService.Extensions;
using AuthService.Persistence.Context;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace AuthService.Controllers;

[ApiController]
[Route("auth-service")]
public class AuthController(IMediator mediator, UserManager<User> userManager, AuthDbContext dbContext) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> RegisterUserAsync([FromBody] RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("login")]
    public async Task<IActionResult> LoginUserAsync([FromBody] LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshTokenAsync([FromBody] RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> RevokeRefreshTokenAsync([FromBody] RevokeRefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(request, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("session/{token}")]
    public async Task<IActionResult> GetGoogleSessionAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetSessionQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    [HttpGet("pending/{token}")]
    public async Task<IActionResult> GetPendingGoogleUserAsync([FromRoute] string token,
        CancellationToken cancellationToken)
    {
        var query = new GetPendingUserQuery(token);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToActionResult();
    }

    // Lightweight health endpoint to satisfy container readiness checks
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "ok" });
    }

    [HttpDelete("account/{userId:guid}")]
    public async Task<IActionResult> DeleteAccountAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return NotFound(new { error = "User not found" });

        // Delete all refresh tokens for this user
        var refreshTokens = await dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId)
            .ToListAsync(cancellationToken);

        if (refreshTokens.Count > 0)
        {
            dbContext.RefreshTokens.RemoveRange(refreshTokens);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // Delete the user (cascades to identity tables)
        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return StatusCode(500, new { error = $"Failed to delete account: {errors}" });
        }

        return Ok(new { message = "Account deleted successfully" });
    }

    [HttpPost("change-password/{userId:guid}")]
    public async Task<IActionResult> ChangePasswordAsync(
        Guid userId,
        [FromBody] ChangePasswordCommand request,
        CancellationToken cancellationToken)
    {
        var command = request with { UserId = userId };
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("change-email/{userId:guid}")]
    public async Task<IActionResult> ChangeEmailAsync(
        Guid userId,
        [FromBody] ChangeEmailCommand request,
        CancellationToken cancellationToken)
    {
        var command = request with { UserId = userId };
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmailAsync(
        [FromBody] ConfirmEmailRequest request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
            return BadRequest(new { error = "Invalid user ID" });

        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        var command = new ConfirmEmailCommand(userId, decodedToken);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmationEmailAsync(
        [FromBody] ResendConfirmationRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ResendConfirmationEmailCommand(request.Email);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("register-child/{parentId:guid}")]
    public async Task<IActionResult> RegisterChildAsync(
        Guid parentId,
        [FromBody] RegisterChildRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterChildCommand(parentId, request.ChildName, request.ChildLastName, request.ChildAge, request.ChildAvatar);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("reset-child-password/{parentId:guid}")]
    public async Task<IActionResult> ResetChildPasswordAsync(
        Guid parentId,
        [FromBody] ResetChildPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ResetChildPasswordCommand(parentId, request.ChildId);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }

    [HttpPost("complete-child-setup/{userId:guid}")]
    public async Task<IActionResult> CompleteChildSetupAsync(
        Guid userId,
        [FromBody] CompleteChildSetupRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CompleteChildSetupCommand(userId, request.CurrentPassword, request.NewPassword);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToActionResult();
    }
}

public record ConfirmEmailRequest(string UserId, string Token);
public record ResendConfirmationRequest(string Email);
public record RegisterChildRequest(string ChildName, string? ChildLastName, int ChildAge, string? ChildAvatar);
public record ResetChildPasswordRequest(Guid ChildId);
public record CompleteChildSetupRequest(string CurrentPassword, string NewPassword);