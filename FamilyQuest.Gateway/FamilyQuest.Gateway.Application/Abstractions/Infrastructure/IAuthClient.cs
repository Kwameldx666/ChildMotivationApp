using FamilyQuest.Gateway.Application.Dto.Login;
using FamilyQuest.Gateway.Common.ResultPattern;

namespace FamilyQuest.Gateway.Application.Abstractions.Infrastructure;

public interface IAuthServiceClient
{
    Task<Result> RegisterAsync(LoginRequest loginRequest, CancellationToken cancellationToken);
}