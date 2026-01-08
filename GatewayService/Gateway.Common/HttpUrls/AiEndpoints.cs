using System.Security.Cryptography.X509Certificates;

namespace Gateway.Common.HttpUrls;

public class AiEndpoints
{
    public string TaskDescription { get; set; } = string.Empty;
    public string TaskSuggestions { get; set; } = string.Empty;
    public string RewardSuggestions { get; set; } = string.Empty;
    public string Chat { get; set; } = string.Empty;
    public string Analytics { get; set; } = string.Empty;
}