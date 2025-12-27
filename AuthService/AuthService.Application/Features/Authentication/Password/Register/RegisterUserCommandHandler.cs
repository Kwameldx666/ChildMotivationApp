using System.Net;
using AuthService.Application.Features.Authentication.Shared;
using AuthService.Application.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.Register;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Result>
{
    private readonly UserManager<Domain.Entities.User> _userManager;

    public RegisterUserCommandHandler(UserManager<Domain.Entities.User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is not null)
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"User with email {request.Email} already exists"));

        var userType = Enum.Parse<UserType>(request.Role.Trim(), true);

        var (familyCode, familyName, familyEmblem, errorResult) = await FamilyContextResolver.ResolveAsync(
            _userManager,
            userType,
            request.Code,
            request.FamilyName,
            request.Emblem,
            cancellationToken);
        if (errorResult is not null) return errorResult;

        var newUser = new Domain.Entities.User
        {
            Email = request.Email,
            UserName = request.Email,
            FamilyCode = familyCode,
            FamilyName = familyName,
            FamilyEmblem = familyEmblem,
            UserStatus = UserStatuses.Active,
            Avatar = string.IsNullOrWhiteSpace(request.Avatar) ? null : request.Avatar,
            Age = request.Age,
            UserType = userType,
            Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name,
            LastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName
        };

        var createResult = await _userManager.CreateAsync(newUser, request.Password);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result.Failure(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }

        var addToRoleResult = await _userManager.AddToRoleAsync(newUser, request.Role);
        if (!addToRoleResult.Succeeded)
        {
            await _userManager.DeleteAsync(newUser);

            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            return Result.Failure(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(error));
        }


        return Result.Success(HttpStatusCode.Created);
    }
}