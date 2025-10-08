using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class DashboardPageViewModel : ViewModelBase
{
    private readonly IModalService _modalService;
    private string _parentName = string.Empty;
    private string _familyName = string.Empty;
    private readonly AsyncCommand _createTaskCommand;

    public DashboardPageViewModel(
        INavigationService navigationService,
        IDialogService dialogService,
        IModalService modalService)
        : base(navigationService, dialogService)
    {
        _modalService = modalService;
        _createTaskCommand = new AsyncCommand(OnCreateTaskAsync, () => !IsBusy);
    }

    public string ParentName
    {
        get => _parentName;
        set
        {
            if (SetProperty(ref _parentName, value))
            {
                OnPropertyChanged(nameof(WelcomeMessage));
                OnPropertyChanged(nameof(HasFamilyName));
                OnPropertyChanged(nameof(FamilyDisplayName));
            }
        }
    }

    public string FamilyName
    {
        get => _familyName;
        set
        {
            if (SetProperty(ref _familyName, value))
            {
                OnPropertyChanged(nameof(HasFamilyName));
                OnPropertyChanged(nameof(FamilyDisplayName));
            }
        }
    }

    public string WelcomeMessage => string.IsNullOrWhiteSpace(ParentName)
        ? "Добро пожаловать!"
        : $"Привет, {ParentName}!";

    public bool HasFamilyName => !string.IsNullOrWhiteSpace(FamilyName);

    public string FamilyDisplayName => HasFamilyName ? FamilyName : "Новая семья";

    public ICommand CreateTaskCommand => _createTaskCommand;

    private async Task OnCreateTaskAsync()
    {
        if (IsBusy)
        {
            return;
        }

        IsBusy = true;
        _createTaskCommand.RaiseCanExecuteChanged();

        try
        {
            await _modalService.ShowCreateTaskModalAsync();
        }
        finally
        {
            IsBusy = false;
            _createTaskCommand.RaiseCanExecuteChanged();
        }
    }
}
