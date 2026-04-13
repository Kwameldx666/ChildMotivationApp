using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Domain.ValueObjects;

namespace TaskService.Application.Features.Tasks.Commands;

internal static class TaskCompletionProgressUpdater
{
    public static async Task ApplyAsync(
        TaskItem task,
        string userId,
        DateTime occurredAt,
        IMissionRepository missionRepository,
        IMissionProgressRepository missionProgressRepository,
        IAchievementRepository achievementRepository,
        IAchievementProgressRepository achievementProgressRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        await UpdateMissionProgressAsync(
            task,
            userId,
            occurredAt,
            missionRepository,
            missionProgressRepository,
            cancellationToken);

        await UpdateAchievementProgressAsync(
            task,
            userId,
            occurredAt,
            achievementRepository,
            achievementProgressRepository,
            cancellationToken);
    }

    private static async Task UpdateMissionProgressAsync(
        TaskItem task,
        string userId,
        DateTime occurredAt,
        IMissionRepository missionRepository,
        IMissionProgressRepository missionProgressRepository,
        CancellationToken cancellationToken)
    {
        var missions = await missionRepository.GetActiveAsync(null, cancellationToken);
        if (missions.Count == 0)
        {
            return;
        }

        var missionIds = missions.Select(mission => mission.Id).ToArray();
        var existingProgress = await missionProgressRepository.GetByUserAsync(userId, missionIds, cancellationToken);
        var progressByMissionId = existingProgress.ToDictionary(progress => progress.MissionId);

        foreach (var mission in missions)
        {
            var delta = ResolveMissionDelta(mission.Code, task);
            if (delta <= 0)
            {
                continue;
            }

            var anchorDate = MissionCycle.GetAnchorDate(occurredAt, mission.Recurrence);
            if (!progressByMissionId.TryGetValue(mission.Id, out var progress))
            {
                progress = MissionProgress.Create(mission.Id, userId, anchorDate, occurredAt);
                await missionProgressRepository.AddAsync(progress, cancellationToken);
                progressByMissionId[mission.Id] = progress;
            }
            else if (progress.ResetIfExpired(anchorDate))
            {
                await missionProgressRepository.UpdateAsync(progress, cancellationToken);
            }

            if (progress.ApplyDelta(delta, mission.TargetValue, occurredAt))
            {
                await missionProgressRepository.UpdateAsync(progress, cancellationToken);
            }
        }
    }

    private static async Task UpdateAchievementProgressAsync(
        TaskItem task,
        string userId,
        DateTime occurredAt,
        IAchievementRepository achievementRepository,
        IAchievementProgressRepository achievementProgressRepository,
        CancellationToken cancellationToken)
    {
        var achievements = await achievementRepository.GetActiveAsync(cancellationToken);
        if (achievements.Count == 0)
        {
            return;
        }

        var achievementIds = achievements.Select(achievement => achievement.Id).ToArray();
        var existingProgress = await achievementProgressRepository.GetByUserAsync(userId, achievementIds, cancellationToken);
        var progressByAchievementId = existingProgress.ToDictionary(progress => progress.AchievementId);

        foreach (var achievement in achievements)
        {
            var delta = ResolveAchievementDelta(achievement.Code, task);
            if (delta <= 0)
            {
                continue;
            }

            if (!progressByAchievementId.TryGetValue(achievement.Id, out var progress))
            {
                progress = AchievementProgress.Create(achievement.Id, userId, occurredAt);
                await achievementProgressRepository.AddAsync(progress, cancellationToken);
                progressByAchievementId[achievement.Id] = progress;
            }

            if (progress.ApplyDelta(delta, achievement.TargetValue, occurredAt))
            {
                await achievementProgressRepository.UpdateAsync(progress, cancellationToken);
            }
        }
    }

    private static int ResolveMissionDelta(string missionCode, TaskItem task)
    {
        var normalizedCode = missionCode.Trim().ToLowerInvariant();
        return normalizedCode switch
        {
            "complete-three-daily-tasks" => 1,
            "complete-twenty-weekly" => 1,
            "earn-twenty-points" => Math.Max(task.RewardPoints, 1),
            "earn-hundred-points-weekly" => Math.Max(task.RewardPoints, 1),
            "complete-hard-task" when task.Difficulty >= 4 => 1,
            _ => 0,
        };
    }

    private static int ResolveAchievementDelta(string achievementCode, TaskItem task)
    {
        var normalizedCode = achievementCode.Trim().ToLowerInvariant();
        return normalizedCode switch
        {
            "helper-10" => 1,
            "helper-100" => 1,
            "daily-rocket" => 1,
            "task-master-50" => 1,
            "sharp-shooter" when task.Difficulty >= 4 => 1,
            _ => 0,
        };
    }
}
