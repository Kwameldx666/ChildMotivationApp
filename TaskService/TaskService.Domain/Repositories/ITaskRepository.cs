using TaskService.Domain.Entities;

namespace TaskService.Domain.Repositories;

public interface ITaskRepository
{
    Task<IReadOnlyList<TaskItem>> GetAsync(string? createdByUserId, CancellationToken cancellationToken = default);
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TaskItem task, CancellationToken cancellationToken = default);
    Task UpdateAsync(TaskItem task, CancellationToken cancellationToken = default);
    Task DeleteAsync(TaskItem task, CancellationToken cancellationToken = default);
}
