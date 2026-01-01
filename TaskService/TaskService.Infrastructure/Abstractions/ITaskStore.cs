using TaskService.Domain.Entities;

namespace TaskService.Infrastructure.Abstractions;

public interface ITaskStore
{
    Task<TaskItem[]> GetAllAsync(string? createdByUserId = null, CancellationToken cancellationToken = default);
    Task<TaskItem?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TaskItem> CreateAsync(TaskItem item, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(TaskItem item, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> CompleteAsync(Guid id, CancellationToken cancellationToken = default);
}
