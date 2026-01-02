using FluentValidation;
using FluentValidation.Results;
using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.CompleteTask;

public class CompleteTaskCommandHandler : IRequestHandler<CompleteTaskCommand>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;

    public CompleteTaskCommandHandler(ITaskRepository repository, IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<Unit> Handle(CompleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.Id);
        }

        if (task.RequiresEvidence && !task.EvidenceSubmitted)
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure("Evidence", "Для этой задачи требуется прикрепить подтверждение перед завершением.")
            });
        }

        task.SetCompletion(true, _dateTimeProvider.UtcNow);
        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
