namespace TaskService.Application.Abstractions;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
