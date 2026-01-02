using System.Linq;
using Microsoft.EntityFrameworkCore;
using TaskService.Domain.Entities;
using TaskService.Domain.Enums;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;

namespace TaskService.Persistence.Repositories;

public class MissionRepository : IMissionRepository
{
    private readonly TaskDbContext _dbContext;

    public MissionRepository(TaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Mission>> GetActiveAsync(MissionRecurrence? recurrence, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Missions
            .AsNoTracking()
            .Where(mission => mission.IsActive);

        if (recurrence.HasValue)
        {
            query = query.Where(mission => mission.Recurrence == recurrence.Value);
        }

        return await query
            .OrderBy(mission => mission.SortOrder)
            .ThenBy(mission => mission.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Mission?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Missions.FirstOrDefaultAsync(mission => mission.Id == id && mission.IsActive, cancellationToken);
    }
}
