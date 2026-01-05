using AuthService.Application.Abstractions.Persistence;
using AuthService.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class GenericRepository<TEntity, TEntityId>(AuthDbContext context) : IGenericRepository<TEntity, TEntityId>
    where TEntity : class
    where TEntityId : IEquatable<TEntityId>
{
    public async Task<TEntity?> GetByIdAsync(TEntityId id)
    {
        return await context.Set<TEntity>().FindAsync(id);
    }

    public async Task<IEnumerable<TEntity>> GetAllAsync()
    {
        return await context.Set<TEntity>().ToListAsync();
    }

    public void Add(TEntity entity)
    {
        context.Set<TEntity>().Add(entity);
    }

    public void Update(TEntity entity)
    {
        context.Set<TEntity>().Update(entity);
    }

    public void Remove(TEntity entity)
    {
        context.Set<TEntity>().Remove(entity);
    }
}