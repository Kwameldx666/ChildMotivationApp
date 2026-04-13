namespace Gateway.Infrastructure.Services.Clients;

public class NotificationEndpoints
{
    public string Base { get; set; } = "/api/usernotifications";
    public string SendBase { get; set; } = "/api/notifications";
    public string PresenceBase { get; set; } = "/api/presence";
}