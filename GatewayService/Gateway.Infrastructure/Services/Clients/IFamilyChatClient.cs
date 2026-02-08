namespace Gateway.Infrastructure.Services.Clients;

public interface IFamilyChatClient
{
    Task<HttpResponseMessage> GetMessagesAsync(string familyId, int limit = 50, DateTime? before = null,
        CancellationToken cancellationToken = default);

    Task<HttpResponseMessage> SendMessageAsync(string familyId, object request,
        CancellationToken cancellationToken = default);
}