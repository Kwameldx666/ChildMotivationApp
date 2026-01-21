using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class TaskCommentRepository : ITaskCommentRepository
{
    private readonly TaskDbContext _context;

    public TaskCommentRepository(TaskDbContext context)
    {
        _context = context;
    }

    public async Task<TaskComment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TaskComments
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<TaskComment>> GetByTaskIdAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        return await _context.TaskComments
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskComment> AddAsync(TaskComment comment, CancellationToken cancellationToken = default)
    {
        await _context.TaskComments.AddAsync(comment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return comment;
    }

    public async Task UpdateAsync(TaskComment comment, CancellationToken cancellationToken = default)
    {
        _context.TaskComments.Update(comment);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var comment = await GetByIdAsync(id, cancellationToken);
        if (comment != null)
        {
            _context.TaskComments.Remove(comment);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
