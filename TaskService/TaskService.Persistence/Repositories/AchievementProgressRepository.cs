using System.Linq;
using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class AchievementProgressRepository : IAchievementProgressRepository
{
    private readonly TaskDbContext _dbContext;

    public AchievementProgressRepository(TaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<AchievementProgress>> GetByUserAsync(string userId, IEnumerable<Guid> achievementIds, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Array.Empty<AchievementProgress>();
        }

        var achievementIdList = achievementIds?.Distinct().ToArray() ?? Array.Empty<Guid>();
        if (achievementIdList.Length == 0)
        {
            return Array.Empty<AchievementProgress>();
        }

        return await _dbContext.AchievementProgress
            .Where(progress => progress.UserId == userId && achievementIdList.Contains(progress.AchievementId))
            .ToListAsync(cancellationToken);
    }

    public Task<AchievementProgress?> GetAsync(Guid achievementId, string userId, CancellationToken cancellationToken = default)
    {
        return _dbContext.AchievementProgress
            .FirstOrDefaultAsync(progress => progress.AchievementId == achievementId && progress.UserId == userId, cancellationToken);
    }

    public Task AddAsync(AchievementProgress progress, CancellationToken cancellationToken = default)
    {
        return _dbContext.AchievementProgress.AddAsync(progress, cancellationToken).AsTask();
    }

    public Task UpdateAsync(AchievementProgress progress, CancellationToken cancellationToken = default)
    {
        _dbContext.AchievementProgress.Update(progress);
        return Task.CompletedTask;
    }
}
