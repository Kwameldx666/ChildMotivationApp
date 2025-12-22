using AuthService.Application.Abstractions.Persistence;
using AuthService.Domain.Entities;
using AuthService.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class RefreshTokenRepository(AuthDbContext context) : IRefreshTokenRepository
{
    public async Task<RefreshToken?> GetRefreshTokenByRefreshToken(string refreshTokenRequest)
    {
        var refreshToken = await context.RefreshTokens
            .Include(u => u.User)
            .FirstOrDefaultAsync(r => r.Token == refreshTokenRequest);

        return refreshToken;
    }

    public void UpdateRefreshToken(RefreshToken refreshToken)
    {
        context.RefreshTokens.Update(refreshToken);
    }

    public async Task SaveChangesAsync()
    {
        await context.SaveChangesAsync();
    }
}