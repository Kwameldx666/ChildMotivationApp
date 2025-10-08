using System.Threading.Tasks;
using Microsoft.Maui.ApplicationModel;

namespace ChildMotivationApp.Services;

public sealed class ClipboardService : IClipboardService
{
    public Task SetTextAsync(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return Task.CompletedTask;
        }

        return MainThread.InvokeOnMainThreadAsync(() => Clipboard.SetTextAsync(text));
    }
}
