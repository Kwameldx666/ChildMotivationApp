using System.Threading.Tasks;

namespace ChildMotivationApp.Services;

public interface IDialogService
{
    Task ShowAlertAsync(string title, string message, string accept);
    Task<bool> ShowConfirmationAsync(string title, string message, string accept, string cancel);
    Task<string?> ShowActionSheetAsync(string title, string cancel, string? destruction, params string[] buttons);
}
