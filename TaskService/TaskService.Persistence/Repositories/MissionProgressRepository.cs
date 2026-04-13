using System.Linq;
using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class MissionProgressRepository : IMissionProgressRepository
{
    private readonly TaskDbContext _dbContext;

    public MissionProgressRepository(TaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<MissionProgress>> GetByUserAsync(string userId, IEnumerable<Guid> missionIds, CancellationToken cancellationToken = default)
    {
        var normalizedUserId = NormalizeUserId(userId);
        if (string.IsNullOrWhiteSpace(normalizedUserId))
        {
            return Array.Empty<MissionProgress>();
        }

        var missionIdList = missionIds?.Distinct().ToArray() ?? Array.Empty<Guid>();
        if (missionIdList.Length == 0)
        {
            return Array.Empty<MissionProgress>();
        }

        return await _dbContext.MissionProgress
            .Include(progress => progress.Mission)
            .Where(progress =>
                missionIdList.Contains(progress.MissionId)
                && (progress.UserId == normalizedUserId || progress.UserId.ToLower() == normalizedUserId))
            .ToListAsync(cancellationToken);
    }

    public Task<MissionProgress?> GetAsync(Guid missionId, string userId, CancellationToken cancellationToken = default)
    {
        var normalizedUserId = NormalizeUserId(userId);

        return _dbContext.MissionProgress
            .Include(progress => progress.Mission)
            .FirstOrDefaultAsync(
                progress => progress.MissionId == missionId
                            && (progress.UserId == normalizedUserId || progress.UserId.ToLower() == normalizedUserId),
                cancellationToken);
    }

    public Task AddAsync(MissionProgress progress, CancellationToken cancellationToken = default)
    {
        return _dbContext.MissionProgress.AddAsync(progress, cancellationToken).AsTask();
    }

    public Task UpdateAsync(MissionProgress progress, CancellationToken cancellationToken = default)
    {
        _dbContext.MissionProgress.Update(progress);
        return Task.CompletedTask;
    }

    private static string NormalizeUserId(string userId)
    {
        return userId?.Trim().ToLowerInvariant() ?? string.Empty;
    }
}
