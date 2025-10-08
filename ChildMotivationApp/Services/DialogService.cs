using System.Threading.Tasks;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Services;

public sealed class DialogService : IDialogService
{
    public Task ShowAlertAsync(string title, string message, string accept)
    {
        var page = Application.Current?.MainPage;
        return page?.DisplayAlert(title, message, accept) ?? Task.CompletedTask;
    }

    public Task<bool> ShowConfirmationAsync(string title, string message, string accept, string cancel)
    {
        var page = Application.Current?.MainPage;
        return page?.DisplayAlert(title, message, accept, cancel) ?? Task.FromResult(false);
    }

    public Task<string?> ShowActionSheetAsync(string title, string cancel, string? destruction, params string[] buttons)
    {
        var page = Application.Current?.MainPage;
        return page?.DisplayActionSheet(title, cancel, destruction, buttons) ?? Task.FromResult<string?>(null);
    }
}
