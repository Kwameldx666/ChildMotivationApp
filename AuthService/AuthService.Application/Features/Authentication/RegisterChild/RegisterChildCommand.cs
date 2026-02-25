using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.RegisterChild;

public record RegisterChildCommand(
    string ParentEmail,
    string ParentPassword,
    string ChildName,
    string ChildLastName,
    int ChildAge,
    string? ChildAvatar) : IRequest<Result>;
