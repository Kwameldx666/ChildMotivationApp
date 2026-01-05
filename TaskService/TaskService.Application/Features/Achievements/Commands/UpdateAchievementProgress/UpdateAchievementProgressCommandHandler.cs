using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Achievements;
using TaskService.Application.Mappings;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Achievements.Commands.UpdateAchievementProgress;

public class UpdateAchievementProgressCommandHandler : IRequestHandler<UpdateAchievementProgressCommand, AchievementDto>
{
    private readonly IAchievementRepository _achievementRepository;
    private readonly IAchievementProgressRepository _progressRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateAchievementProgressCommandHandler(
        IAchievementRepository achievementRepository,
        IAchievementProgressRepository progressRepository,
        IDateTimeProvider dateTimeProvider,
        IUnitOfWork unitOfWork)
    {
        _achievementRepository = achievementRepository;
        _progressRepository = progressRepository;
        _dateTimeProvider = dateTimeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<AchievementDto> Handle(UpdateAchievementProgressCommand request, CancellationToken cancellationToken)
    {
        if (request.AchievementId == Guid.Empty)
        {
            throw new ArgumentException("Achievement identifier is required", nameof(request.AchievementId));
        }

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            throw new ArgumentException("User identifier is required", nameof(request.UserId));
        }

        var achievement = await _achievementRepository.GetByIdAsync(request.AchievementId, cancellationToken);
        if (achievement is null)
        {
            throw new NotFoundException(nameof(Achievement), request.AchievementId);
        }

        var delta = request.ProgressDelta;
        if (delta <= 0)
        {
            delta = 1;
        }

        var now = _dateTimeProvider.UtcNow;
        var progress = await _progressRepository.GetAsync(request.AchievementId, request.UserId, cancellationToken);
        var isNew = progress is null;

        if (isNew)
        {
            progress = AchievementProgress.Create(request.AchievementId, request.UserId, now);
            await _progressRepository.AddAsync(progress!, cancellationToken);
        }

        if (progress!.ApplyDelta(delta, achievement.TargetValue, now) && !isNew)
        {
            await _progressRepository.UpdateAsync(progress, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return achievement.ToDto(progress);
    }
}
