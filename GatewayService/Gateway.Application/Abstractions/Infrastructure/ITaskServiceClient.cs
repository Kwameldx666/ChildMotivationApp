namespace Gateway.Application.Abstractions.Infrastructure;

public interface ITaskServiceClient
{
    Task<System.Net.Http.HttpResponseMessage> GetAllAsync(string? createdByUserId = null, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> CreateAsync(object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> UpdateAsync(Guid id, object request, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<System.Net.Http.HttpResponseMessage> CompleteAsync(Guid id, CancellationToken cancellationToken = default);
}
