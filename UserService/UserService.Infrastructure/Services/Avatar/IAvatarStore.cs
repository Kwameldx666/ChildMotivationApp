using Microsoft.AspNetCore.Http;

namespace UserService.Infrastructure.Services.Avatar;

public interface IAvatarStore
{
    /// <summary>
    /// Saves the provided avatar file for the given user and returns a public URL path to the saved file.
    /// </summary>
    Task<string> SaveAsync(Guid userId, IFormFile file, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a stored avatar file. Returns true if deleted.
    /// </summary>
    Task<bool> DeleteAsync(string relativePath, CancellationToken cancellationToken = default);
}