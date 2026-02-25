using TaskService.Domain.Entities;

namespace TaskService.Domain.Repositories;

public interface ITaskCommentRepository
{
    Task<TaskComment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskComment>> GetByTaskIdAsync(Guid taskId, CancellationToken cancellationToken = default);
    Task<TaskComment> AddAsync(TaskComment comment, CancellationToken cancellationToken = default);
    Task UpdateAsync(TaskComment comment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
