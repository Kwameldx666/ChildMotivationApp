using AuthService.Application.Abstractions.Persistence;
using Microsoft.Extensions.Configuration;
using Quartz;

namespace AuthService.Infrastructure.Services.Quartz;

public class CleanRefreshTokenJob(IRefreshTokenRepository refreshTokenRepository)
    : IJob
{
    public async Task Execute(IJobExecutionContext context)
    {
        await refreshTokenRepository.DeleteExpiredRefreshTokensAsync(context.CancellationToken);
    }
}