using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class CreateFamilyPageViewModel : ViewModelBase
{
    private readonly IShellHostService _shellHostService;
    private readonly AsyncCommand _createFamilyCommand;
    private string _parentName = string.Empty;
    private string _familyName = string.Empty;
    private string? _validationMessage;

    public CreateFamilyPageViewModel(
        INavigationService navigationService,
        IDialogService dialogService,
        IShellHostService shellHostService)
        : base(navigationService, dialogService)
    {
        _shellHostService = shellHostService;
        _createFamilyCommand = new AsyncCommand(OnCreateFamilyAsync, () => !IsBusy);
    }

    public string ParentName
    {
        get => _parentName;
        set => SetProperty(ref _parentName, value);
    }

    public string FamilyName
    {
        get => _familyName;
        set
        {
            if (SetProperty(ref _familyName, value))
            {
                ValidationMessage = null;
            }
        }
    }

    public string? ValidationMessage
    {
        get => _validationMessage;
        private set
        {
            if (SetProperty(ref _validationMessage, value))
            {
                OnPropertyChanged(nameof(HasValidationMessage));
            }
        }
    }

    public bool HasValidationMessage => !string.IsNullOrWhiteSpace(_validationMessage);

    public ICommand CreateFamilyCommand => _createFamilyCommand;

    private async Task OnCreateFamilyAsync()
    {
        if (string.IsNullOrWhiteSpace(FamilyName))
        {
            ValidationMessage = "Пожалуйста, введи название семьи";
            return;
        }

        var trimmedName = FamilyName.Trim();

        if (trimmedName.Length < 2)
        {
            ValidationMessage = "Название семьи должно быть длиннее 2 символов";
            return;
        }

        if (trimmedName.Length > 50)
        {
            ValidationMessage = "Название семьи не может быть длиннее 50 символов";
            return;
        }

        ValidationMessage = null;
        IsBusy = true;
        _createFamilyCommand.RaiseCanExecuteChanged();

        try
        {
            var message = string.IsNullOrEmpty(ParentName)
                ? $"Семья \"{trimmedName}\" создана!"
                : $"Поздравляем, {ParentName}! Семья \"{trimmedName}\" создана!";

            await DialogService.ShowAlertAsync("Новая семья", message, "Продолжить");

            _shellHostService.ShowMainNavigation();
            var switched = await _shellHostService.SwitchToTabAsync("home", "dashboard");
            if (!switched)
            {
                await NavigationService.GoToAsync("//home/dashboard");
            }

            FamilyName = string.Empty;
        }
        finally
        {
            IsBusy = false;
            _createFamilyCommand.RaiseCanExecuteChanged();
        }
    }
}
