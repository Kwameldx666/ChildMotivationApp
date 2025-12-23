using AuthService.Application.Abstractions.Persistence;
using AuthService.Domain.Entities;
using AuthService.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class RefreshTokenRepository(AuthDbContext context) : IRefreshTokenRepository
{
    public async Task<RefreshToken?> GetByTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await context.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken, cancellationToken);
    }

    public async Task<RefreshToken?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.RefreshTokens
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);
    }

    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        await context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
    }

    public void Update(RefreshToken refreshToken)
    {
        context.RefreshTokens.Update(refreshToken);
    }

    public void Remove(RefreshToken refreshToken)
    {
        context.RefreshTokens.Remove(refreshToken);
    }

    public async Task DeleteExpiredRefreshTokensAsync(CancellationToken cancellationToken = default)
    {
        await context.RefreshTokens
            .Where(r => r.ExpiresOnUtc <= DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);
    }
}