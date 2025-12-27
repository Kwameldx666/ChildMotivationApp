using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class GenericRepository<TEntity, TEntityId> : IGenericRepository<TEntity, TEntityId>
    where TEntity : class
    where TEntityId : IEquatable<TEntityId>
{
    private readonly AuthDbContext _context;

    public GenericRepository(AuthDbContext context)
    {
        _context = context;
    }

    public async Task<TEntity?> GetByIdAsync(TEntityId id)
    {
        return await _context.Set<TEntity>().FindAsync(id);
    }

    public async Task<IEnumerable<TEntity>> GetAllAsync()
    {
        return await _context.Set<TEntity>().ToListAsync();
    }

    public void Add(TEntity entity)
    {
        _context.Set<TEntity>().Add(entity);
    }

    public void Update(TEntity entity)
    {
        _context.Set<TEntity>().Update(entity);
    }

    public void Remove(TEntity entity)
    {
        _context.Set<TEntity>().Remove(entity);
    }

    public async Task SaveChanges(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}