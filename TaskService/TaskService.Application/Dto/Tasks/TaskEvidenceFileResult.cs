namespace TaskService.Application.Dto.Tasks;

public sealed record TaskEvidenceFileResult(Stream Content, string ContentType, string FileName) : IDisposable, IAsyncDisposable
{
    public void Dispose()
    {
        Content.Dispose();
    }

    public ValueTask DisposeAsync()
    {
        return Content.DisposeAsync();
    }
}
