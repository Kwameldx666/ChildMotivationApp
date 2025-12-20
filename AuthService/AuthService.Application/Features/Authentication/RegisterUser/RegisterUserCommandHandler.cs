using System;
using System.Linq;
using System.Net;
using AuthService.Common.Constants;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.RegisterUser;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Result>
{
    private readonly UserManager<User> _userManager;

    public RegisterUserCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is not null)
        {
            return Result.Failure(HttpStatusCode.Conflict,
                DefaultErrors.Conflict($"User with email {request.Email} already exists"));
        }

        var userType = Enum.Parse<UserType>(request.Role.Trim(), true);

        var newUser = new User
        {
            Email = request.Email,
            UserName = request.Email,
            FamilyCode = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code,
            UserStatus = UserStatuses.Active,
            Avatar = string.IsNullOrWhiteSpace(request.Avatar) ? null : request.Avatar,
            Age = request.Age,
            UserType = userType
        };

        var createResult = await _userManager.CreateAsync(newUser, request.Password);

        if (!createResult.Succeeded)
        {
            var errorDescription = createResult.Errors.FirstOrDefault()?.Description ?? "Failed to create user";
            return Result.Failure(HttpStatusCode.BadRequest, DefaultErrors.BadRequest(errorDescription));
        }

        return Result.Success(HttpStatusCode.Created);
    }
}