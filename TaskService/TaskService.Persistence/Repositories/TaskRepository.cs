using System.Linq;
using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly TaskDbContext _dbContext;

    public TaskRepository(TaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TaskItem>> GetAsync(
        string? createdByUserId, 
        string? assignedToUserId = null, 
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Tasks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(createdByUserId))
        {
            query = query.Where(task => task.CreatedByUserId == createdByUserId);
        }

        if (!string.IsNullOrWhiteSpace(assignedToUserId))
        {
            query = query.Where(task => task.AssignedToUserId == assignedToUserId);
        }

        return await query
            .OrderByDescending(task => task.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tasks.FirstOrDefaultAsync(task => task.Id == id, cancellationToken);
    }

    public async Task AddAsync(TaskItem task, CancellationToken cancellationToken = default)
    {
        await _dbContext.Tasks.AddAsync(task, cancellationToken);
    }

    public Task UpdateAsync(TaskItem task, CancellationToken cancellationToken = default)
    {
        _dbContext.Tasks.Update(task);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(TaskItem task, CancellationToken cancellationToken = default)
    {
        _dbContext.Tasks.Remove(task);
        return Task.CompletedTask;
    }
}
