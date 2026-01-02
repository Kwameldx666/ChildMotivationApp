namespace TaskService.Application.Abstractions;

public interface ITaskEvidenceStorage
{
    Task<(string StoragePath, long FileSize)> SaveAsync(Stream content, string fileName, CancellationToken cancellationToken = default);
    Task<Stream> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default);
    Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default);
}
