using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Infrastructure.Abstractions;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class EfTaskStore : ITaskStore
{
    private readonly TaskDbContext _db;

    public EfTaskStore(TaskDbContext db)
    {
        _db = db;
    }

    public async Task<TaskItem[]> GetAllAsync(string? createdByUserId = null, CancellationToken cancellationToken = default)
    {
        var query = _db.Tasks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(createdByUserId))
            query = query.Where(task => task.CreatedByUserId == createdByUserId);

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<TaskItem?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.Tasks.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<TaskItem> CreateAsync(TaskItem item, CancellationToken cancellationToken = default)
    {
        if (item.Id == Guid.Empty) item.Id = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(item.CreatedByUserId))
            throw new ArgumentException("CreatedByUserId is required", nameof(item));
        _db.Tasks.Add(item);
        await _db.SaveChangesAsync(cancellationToken);
        return item;
    }

    public async Task<bool> UpdateAsync(TaskItem item, CancellationToken cancellationToken = default)
    {
        var existing = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == item.Id, cancellationToken);
        if (existing is null) return false;

        item.CreatedByUserId = existing.CreatedByUserId;
        item.CreatedAt = existing.CreatedAt;

        _db.Tasks.Update(item);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _db.Tasks.FindAsync(new object[] { id }, cancellationToken);
        if (entity is null) return false;
        _db.Tasks.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CompleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _db.Tasks.FindAsync(new object[] { id }, cancellationToken);
        if (entity is null) return false;
        if (entity.Completed) return true; // idempotent
        entity.Completed = true;
        _db.Tasks.Update(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}