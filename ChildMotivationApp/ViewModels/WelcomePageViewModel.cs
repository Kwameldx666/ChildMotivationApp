using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class WelcomePageViewModel : ViewModelBase
{
    public WelcomePageViewModel(INavigationService navigationService, IDialogService dialogService)
        : base(navigationService, dialogService)
    {
        StartCommand = new AsyncCommand(OnStartAsync);
    }

    public ICommand StartCommand { get; }

    private Task OnStartAsync()
    {
        return NavigationService.GoToAsync("//roleselection");
    }
}
