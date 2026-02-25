using TaskService.Domain.Entities;

namespace TaskService.Domain.Repositories;

public interface IAchievementProgressRepository
{
    Task<IReadOnlyList<AchievementProgress>> GetByUserAsync(string userId, IEnumerable<Guid> achievementIds, CancellationToken cancellationToken = default);
    Task<AchievementProgress?> GetAsync(Guid achievementId, string userId, CancellationToken cancellationToken = default);
    Task AddAsync(AchievementProgress progress, CancellationToken cancellationToken = default);
    Task UpdateAsync(AchievementProgress progress, CancellationToken cancellationToken = default);
}
