using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.RegisterUser;

public record RegisterUserCommand(
    string Email,
    string Password,
    string Role,
    string Name,
    string LastName,
    string? Avatar,
    int? Age,
    string? Code,
    string? FamilyName,
    string? Emblem) : IRequest<Result>;
