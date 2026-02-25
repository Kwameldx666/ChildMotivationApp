using TaskService.Domain.Entities;

namespace TaskService.Domain.Repositories;

public interface IMissionProgressRepository
{
    Task<IReadOnlyList<MissionProgress>> GetByUserAsync(string userId, IEnumerable<Guid> missionIds, CancellationToken cancellationToken = default);
    Task<MissionProgress?> GetAsync(Guid missionId, string userId, CancellationToken cancellationToken = default);
    Task AddAsync(MissionProgress progress, CancellationToken cancellationToken = default);
    Task UpdateAsync(MissionProgress progress, CancellationToken cancellationToken = default);
}
