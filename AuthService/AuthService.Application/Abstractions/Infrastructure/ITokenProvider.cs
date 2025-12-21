using AuthService.Application.Dto;

namespace AuthService.Application.Abstractions.Infrastructure;

public interface ITokenProvider
{
    (string,int) GenerateAccessToken(UserArgs args);
}