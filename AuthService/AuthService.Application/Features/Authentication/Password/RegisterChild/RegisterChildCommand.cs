using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Password.RegisterChild;

public record RegisterChildCommand(
    Guid ParentId,
    string ChildName,
    string? ChildLastName,
    int ChildAge,
    string? ChildAvatar) : IRequest<Result<RegisterChildResponse>>;

public record RegisterChildResponse(
    string ChildEmail,
    string ChildPassword,
    string ChildName,
    string ChildLastName);
