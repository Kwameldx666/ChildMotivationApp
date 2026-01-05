using TaskService.Domain.Entities;
using TaskService.Domain.Enums;

namespace TaskService.Domain.Repositories;

public interface IMissionRepository
{
    Task<IReadOnlyList<Mission>> GetActiveAsync(MissionRecurrence? recurrence, CancellationToken cancellationToken = default);
    Task<Mission?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
