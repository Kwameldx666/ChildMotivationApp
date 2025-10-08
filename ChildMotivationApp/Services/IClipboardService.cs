using System.Threading.Tasks;

namespace ChildMotivationApp.Services;

public interface IClipboardService
{
    Task SetTextAsync(string text);
}
