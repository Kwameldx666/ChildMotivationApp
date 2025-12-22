using AuthService.Application.Abstractions.Persistence;
using AuthService.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class GenericRepository<TEntity, TEntityId> : IGenericRepository<TEntity, TEntityId>
    where TEntity : class
    where TEntityId : IEquatable<TEntityId>
{
    protected readonly AuthDbContext Context;

    public GenericRepository(AuthDbContext context)
    {
        Context = context;
    }

    public async Task<TEntity?> GetByIdAsync(TEntityId id)
    {
        return await Context.Set<TEntity>().FindAsync(id);
    }

    public async Task<IEnumerable<TEntity>> GetAllAsync()
    {
        return await Context.Set<TEntity>().ToListAsync();
    }

    public void Add(TEntity entity)
    {
        Context.Set<TEntity>().Add(entity);
    }

    public void Update(TEntity entity)
    {
        Context.Set<TEntity>().Update(entity);
    }

    public void Remove(TEntity entity)
    {
        Context.Set<TEntity>().Remove(entity);
    }

    public async Task SaveChanges(CancellationToken cancellationToken = default)
    {
        await Context.SaveChangesAsync(cancellationToken);
    }
}