using System.Threading.Tasks;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public abstract class ViewModelBase : ObservableObject
{
    private bool _isBusy;

    protected ViewModelBase(INavigationService navigationService, IDialogService dialogService)
    {
        NavigationService = navigationService;
        DialogService = dialogService;
    }

    protected INavigationService NavigationService { get; }

    protected IDialogService DialogService { get; }

    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    public virtual Task OnAppearingAsync() => Task.CompletedTask;

    public virtual Task OnDisappearingAsync() => Task.CompletedTask;
}
