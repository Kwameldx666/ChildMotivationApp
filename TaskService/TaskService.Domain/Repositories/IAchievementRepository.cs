using TaskService.Domain.Entities;

namespace TaskService.Domain.Repositories;

public interface IAchievementRepository
{
    Task<IReadOnlyList<Achievement>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Achievement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
