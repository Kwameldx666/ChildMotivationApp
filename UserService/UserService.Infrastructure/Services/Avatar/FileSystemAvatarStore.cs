using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace UserService.Infrastructure.Services.Avatar;

public class FileSystemAvatarStore : IAvatarStore
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<FileSystemAvatarStore> _logger;
    private const long MaxFileSize = 2 * 1024 * 1024; // 2MB
    private static readonly HashSet<string> AllowedTypes = new() { "image/png", "image/jpeg", "image/webp" };

    public FileSystemAvatarStore(IWebHostEnvironment env, ILogger<FileSystemAvatarStore> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<string> SaveAsync(Guid userId, IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file is null) throw new ArgumentNullException(nameof(file));
        if (file.Length == 0) throw new InvalidOperationException("Empty file");
        if (file.Length > MaxFileSize) throw new InvalidOperationException($"File size exceeds limit ({MaxFileSize} bytes)");
        if (!AllowedTypes.Contains(file.ContentType?.ToLowerInvariant() ?? string.Empty))
            throw new InvalidOperationException("Unsupported file content type");

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
        {
            ext = file.ContentType switch
            {
                "image/png" => ".png",
                "image/jpeg" => ".jpg",
                "image/webp" => ".webp",
                _ => ".dat"
            };
        }

        var fileName = $"{userId}_{DateTime.UtcNow.Ticks}{ext}";
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var dir = Path.Combine(webRoot, "avatars");
        Directory.CreateDirectory(dir);

        var path = Path.Combine(dir, fileName);
        try
        {
            await using var fs = new FileStream(path, FileMode.CreateNew);
            await file.CopyToAsync(fs, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save avatar file for user {UserId}", userId);
            throw;
        }

        // Return relative path that will be served as static file.
        return $"/avatars/{fileName}";
    }

    public Task<bool> DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return Task.FromResult(false);
            var trimmed = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var path = Path.Combine(webRoot, trimmed);
            if (File.Exists(path))
            {
                File.Delete(path);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }
}