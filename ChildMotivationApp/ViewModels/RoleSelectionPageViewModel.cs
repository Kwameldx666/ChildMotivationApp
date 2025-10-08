using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class RoleSelectionPageViewModel : ViewModelBase
{
    public RoleSelectionPageViewModel(INavigationService navigationService, IDialogService dialogService)
        : base(navigationService, dialogService)
    {
        SelectParentCommand = new AsyncCommand(OnParentSelectedAsync);
        SelectChildCommand = new AsyncCommand(OnChildSelectedAsync);
    }

    public ICommand SelectParentCommand { get; }

    public ICommand SelectChildCommand { get; }

    private Task OnParentSelectedAsync()
    {
        var parameters = new Dictionary<string, object?>
        {
            ["role"] = "Parent"
        };

        return NavigationService.GoToAsync("//profilesetup", parameters);
    }

    private Task OnChildSelectedAsync()
    {
        var parameters = new Dictionary<string, object?>
        {
            ["role"] = "Child"
        };

        return NavigationService.GoToAsync("//profilesetup", parameters);
    }
}
