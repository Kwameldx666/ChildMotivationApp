using System.Threading.Tasks;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.Pages;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Services;

public sealed class ModalService : IModalService
{
    public Task ShowCreateTaskModalAsync()
    {
        return MainThread.InvokeOnMainThreadAsync(async () =>
        {
            if (Application.Current?.MainPage is null)
            {
                return;
            }

            var modal = ServiceHelper.GetRequiredService<CreateTaskModal>();
            await Application.Current.MainPage.Navigation.PushModalAsync(modal);
        });
    }
}
