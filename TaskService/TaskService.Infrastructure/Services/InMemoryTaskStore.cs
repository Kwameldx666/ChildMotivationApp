using TaskService.Domain.Entities;
using TaskService.Infrastructure.Abstractions;

namespace TaskService.Infrastructure.Services;

public class InMemoryTaskStore : ITaskStore
{
    private readonly Dictionary<Guid, TaskItem> _storage = new();

    public Task<TaskItem[]> GetAllAsync(string? createdByUserId = null, CancellationToken cancellationToken = default)
    {
        var query = _storage.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(createdByUserId))
            query = query.Where(task => string.Equals(task.CreatedByUserId, createdByUserId, StringComparison.Ordinal));

        return Task.FromResult(query.ToArray());
    }

    public Task<TaskItem?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _storage.TryGetValue(id, out var item);
        return Task.FromResult(item);
    }

    public Task<TaskItem> CreateAsync(TaskItem item, CancellationToken cancellationToken = default)
    {
        item.Id = item.Id == Guid.Empty ? Guid.NewGuid() : item.Id;
        item.CreatedAt = DateTime.UtcNow;
        _storage[item.Id] = item;
        return Task.FromResult(item);
    }

    public Task<bool> UpdateAsync(TaskItem item, CancellationToken cancellationToken = default)
    {
        if (!_storage.ContainsKey(item.Id)) return Task.FromResult(false);
        _storage[item.Id] = item;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_storage.Remove(id));
    }

    public Task<bool> CompleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!_storage.TryGetValue(id, out var item)) return Task.FromResult(false);
        if (item.Completed) return Task.FromResult(true);
        item.Completed = true;
        _storage[id] = item;
        return Task.FromResult(true);
    }
}