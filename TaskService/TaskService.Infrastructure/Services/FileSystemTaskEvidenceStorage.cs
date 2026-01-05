using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TaskService.Application.Abstractions;
using TaskService.Infrastructure.Options;

namespace TaskService.Infrastructure.Services;

public class FileSystemTaskEvidenceStorage : ITaskEvidenceStorage
{
    private readonly ILogger<FileSystemTaskEvidenceStorage> _logger;
    private readonly string _rootPath;

    public FileSystemTaskEvidenceStorage(IOptions<TaskEvidenceStorageOptions> options, ILogger<FileSystemTaskEvidenceStorage> logger)
    {
        _logger = logger;
        var configuredRoot = options.Value.RootPath;
        _rootPath = string.IsNullOrWhiteSpace(configuredRoot)
            ? Path.Combine(AppContext.BaseDirectory, "evidence")
            : configuredRoot;
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<(string StoragePath, long FileSize)> SaveAsync(Stream content, string fileName, CancellationToken cancellationToken = default)
    {
        if (content is null) throw new ArgumentNullException(nameof(content));
        var extension = Path.GetExtension(fileName);
        var storageName = $"{Guid.NewGuid():N}{extension}";
        var destinationPath = ResolveAbsolutePath(storageName);

        Directory.CreateDirectory(Path.GetDirectoryName(destinationPath)!);

        await using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await content.CopyToAsync(fileStream, cancellationToken);
            await fileStream.FlushAsync(cancellationToken);
        }

        var info = new FileInfo(destinationPath);
        _logger.LogInformation("Stored task evidence at {Path} ({Size} bytes)", storageName, info.Length);
        return (storageName, info.Length);
    }

    public async Task<Stream> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        var absolutePath = ResolveAbsolutePath(storagePath);
        if (!File.Exists(absolutePath))
        {
            throw new FileNotFoundException("Evidence file not found", storagePath);
        }

        var stream = new FileStream(absolutePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
        return await Task.FromResult(stream);
    }

    public Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var absolutePath = ResolveAbsolutePath(storagePath);
            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
                _logger.LogDebug("Deleted task evidence at {Path}", storagePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete evidence at {Path}", storagePath);
        }

        return Task.CompletedTask;
    }

    private string ResolveAbsolutePath(string storageName)
    {
        var sanitized = storageName.Replace("..", string.Empty)
            .TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        return Path.Combine(_rootPath, sanitized);
    }
}
