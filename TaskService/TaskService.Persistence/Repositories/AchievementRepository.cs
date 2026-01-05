using System.Linq;
using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class AchievementRepository : IAchievementRepository
{
    private readonly TaskDbContext _dbContext;

    public AchievementRepository(TaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Achievement>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .OrderBy(achievement => achievement.SortOrder)
            .ThenBy(achievement => achievement.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Achievement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Achievements.FirstOrDefaultAsync(achievement => achievement.Id == id && achievement.IsActive, cancellationToken);
    }
}
