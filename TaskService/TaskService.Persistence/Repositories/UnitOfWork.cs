using TaskService.Application.Abstractions;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly TaskDbContext _dbContext;

    public UnitOfWork(TaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
