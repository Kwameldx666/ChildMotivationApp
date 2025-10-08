using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class ProfileSetupPageViewModel : ViewModelBase
{
    private readonly IShellHostService _shellHostService;
    private readonly AsyncCommand _continueCommand;
    private readonly AsyncCommand _decreaseAgeCommand;
    private readonly AsyncCommand _increaseAgeCommand;
    private string _role = "Parent";
    private string _name = string.Empty;
    private string _ageText = "8";
    private bool _isChild;
    private bool _showAgeSection;
    private string? _validationMessage;

    public ProfileSetupPageViewModel(
        INavigationService navigationService,
        IDialogService dialogService,
        IShellHostService shellHostService)
        : base(navigationService, dialogService)
    {
        _shellHostService = shellHostService;
        _decreaseAgeCommand = new AsyncCommand(OnDecreaseAgeAsync);
        _increaseAgeCommand = new AsyncCommand(OnIncreaseAgeAsync);
        _continueCommand = new AsyncCommand(OnContinueAsync, () => !IsBusy);
        UpdateForRole();
    }

    public ICommand DecreaseAgeCommand => _decreaseAgeCommand;

    public ICommand IncreaseAgeCommand => _increaseAgeCommand;

    public ICommand ContinueCommand => _continueCommand;

    public string Role
    {
        get => _role;
        set
        {
            if (SetProperty(ref _role, value))
            {
                _isChild = string.Equals(_role, "Child", StringComparison.OrdinalIgnoreCase);
                UpdateForRole();
            }
        }
    }

    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }

    public string AgeText
    {
        get => _ageText;
        set
        {
            if (SetProperty(ref _ageText, value))
            {
                ValidateAgeText();
            }
        }
    }

    public bool ShowAgeSection
    {
        get => _showAgeSection;
        private set => SetProperty(ref _showAgeSection, value);
    }

    public string RoleLabel => _isChild ? "Ребёнок" : "Родитель";

    public string PageTitle => "Расскажи о себе";

    public string PageSubtitle => "Создай свой профиль";

    public string AvatarImage => _isChild ? "child.png" : "parent.png";

    public string PrimaryColor => _isChild ? "#D946EF" : "#3B82F6";

    public string BadgeBackground => _isChild ? "#FAE8FF" : "#EFF6FF";

    public string RoleTextColor => _isChild ? "#D946EF" : "#3B82F6";

    public string ContinueGradientStart => _isChild ? "#D946EF" : "#3B82F6";

    public string ContinueGradientEnd => _isChild ? "#EC4899" : "#60A5FA";

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

    public override Task OnAppearingAsync()
    {
        // Ensure validation message hidden when role changes from child to parent.
        if (!_isChild)
        {
            ValidationMessage = null;
        }

        return base.OnAppearingAsync();
    }

    private void UpdateForRole()
    {
        ShowAgeSection = _isChild;
        OnPropertyChanged(nameof(RoleLabel));
        OnPropertyChanged(nameof(AvatarImage));
        OnPropertyChanged(nameof(PrimaryColor));
        OnPropertyChanged(nameof(BadgeBackground));
        OnPropertyChanged(nameof(RoleTextColor));
        OnPropertyChanged(nameof(ContinueGradientStart));
        OnPropertyChanged(nameof(ContinueGradientEnd));

        if (!_isChild)
        {
            ValidationMessage = null;
        }
    }

    private void ValidateAgeText()
    {
        if (!_isChild)
        {
            return;
        }

        if (!int.TryParse(_ageText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var age))
        {
            ValidationMessage = "Пожалуйста, введи корректный возраст";
            return;
        }

        if (age < 3)
        {
            ValidationMessage = "Возраст не может быть меньше 3";
            AgeText = "3";
            return;
        }

        if (age > 18)
        {
            ValidationMessage = "Возраст не может быть больше 18";
            AgeText = "18";
            return;
        }

        ValidationMessage = null;
    }

    private Task OnDecreaseAgeAsync()
    {
        if (!_isChild)
        {
            return Task.CompletedTask;
        }

        if (!int.TryParse(_ageText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var age))
        {
            return Task.CompletedTask;
        }

        if (age <= 3)
        {
            AgeText = "3";
            return Task.CompletedTask;
        }

        AgeText = (age - 1).ToString(CultureInfo.InvariantCulture);
        return Task.CompletedTask;
    }

    private Task OnIncreaseAgeAsync()
    {
        if (!_isChild)
        {
            return Task.CompletedTask;
        }

        if (!int.TryParse(_ageText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var age))
        {
            return Task.CompletedTask;
        }

        if (age >= 18)
        {
            AgeText = "18";
            return Task.CompletedTask;
        }

        AgeText = (age + 1).ToString(CultureInfo.InvariantCulture);
        return Task.CompletedTask;
    }

    private async Task OnContinueAsync()
    {
        if (string.IsNullOrWhiteSpace(Name))
        {
            await DialogService.ShowAlertAsync("Ошибка", "Пожалуйста, введи своё имя", "OK");
            return;
        }

        if (_isChild)
        {
            if (!int.TryParse(_ageText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var age) || age < 3 || age > 18)
            {
                await DialogService.ShowAlertAsync("Ошибка", "Пожалуйста, введи корректный возраст (3-18)", "OK");
                return;
            }
        }

        IsBusy = true;
        _continueCommand.RaiseCanExecuteChanged();

        try
        {
            var parameters = new Dictionary<string, object?>
            {
                ["parentName"] = Name.Trim()
            };

            if (_isChild)
            {
                _shellHostService.ShowMainNavigation();
                var switched = await _shellHostService.SwitchToTabAsync("home", "dashboard");
                if (!switched)
                {
                    await NavigationService.GoToAsync("//home/dashboard");
                }
            }
            else
            {
                await NavigationService.GoToAsync("//createfamily", parameters);
            }
        }
        finally
        {
            IsBusy = false;
            _continueCommand.RaiseCanExecuteChanged();
        }
    }
}
