using AuthService.Application.Abstractions.Persistence;
using AuthService.Persistence.Context;

namespace AuthService.Persistence.Repositories;

public class UnitOfWork(AuthDbContext context) : IUnitOfWork
{
    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}