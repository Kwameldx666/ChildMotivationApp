using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class ParentProfilePageViewModel : ViewModelBase
{
    private readonly IShellHostService _shellHostService;
    private readonly IClipboardService _clipboardService;
    private readonly AsyncCommand _editProfileCommand;
    private readonly AsyncCommand _copyInviteCodeCommand;
    private readonly AsyncCommand _logoutCommand;
    private readonly AsyncCommand _viewStatisticsCommand;
    private readonly AsyncCommand _manageFamilyCommand;
    private readonly AsyncCommand _openRewardsCommand;
    private string _displayName = "panpo";
    private string _userName = "panpo";
    private string _familyName = "panpo";
    private string _inviteCode = "TA8EYT";
    private bool _isPushNotificationsEnabled = true;
    private bool _isEmailNotificationsEnabled;

    public ParentProfilePageViewModel(
        INavigationService navigationService,
        IDialogService dialogService,
        IShellHostService shellHostService,
        IClipboardService clipboardService)
        : base(navigationService, dialogService)
    {
        _shellHostService = shellHostService;
        _clipboardService = clipboardService;

        _editProfileCommand = new AsyncCommand(OnEditProfileAsync, () => !IsBusy);
        _copyInviteCodeCommand = new AsyncCommand(OnCopyInviteCodeAsync, () => !IsBusy);
        _logoutCommand = new AsyncCommand(OnLogoutAsync, () => !IsBusy);
        _viewStatisticsCommand = new AsyncCommand(OnViewStatisticsAsync, () => !IsBusy);
        _manageFamilyCommand = new AsyncCommand(OnManageFamilyAsync, () => !IsBusy);
        _openRewardsCommand = new AsyncCommand(OnOpenRewardsAsync, () => !IsBusy);
    }

    public string DisplayName
    {
        get => _displayName;
        set => SetProperty(ref _displayName, value);
    }

    public string UserName
    {
        get => _userName;
        set => SetProperty(ref _userName, value);
    }

    public string FamilyName
    {
        get => _familyName;
        set => SetProperty(ref _familyName, value);
    }

    public string InviteCode
    {
        get => _inviteCode;
        set => SetProperty(ref _inviteCode, value);
    }

    public bool IsPushNotificationsEnabled
    {
        get => _isPushNotificationsEnabled;
        set => SetProperty(ref _isPushNotificationsEnabled, value);
    }

    public bool IsEmailNotificationsEnabled
    {
        get => _isEmailNotificationsEnabled;
        set => SetProperty(ref _isEmailNotificationsEnabled, value);
    }

    public ICommand EditProfileCommand => _editProfileCommand;

    public ICommand CopyInviteCodeCommand => _copyInviteCodeCommand;

    public ICommand LogoutCommand => _logoutCommand;

    public ICommand ViewStatisticsCommand => _viewStatisticsCommand;

    public ICommand ManageFamilyCommand => _manageFamilyCommand;

    public ICommand OpenRewardsCommand => _openRewardsCommand;

    public override Task OnAppearingAsync()
    {
        // Placeholder for future data loading logic.
        return Task.CompletedTask;
    }

    private async Task OnEditProfileAsync()
    {
        await DialogService.ShowAlertAsync("Скоро", "Редактирование профиля станет доступно в будущих обновлениях.", "Понятно");
    }

    private async Task OnCopyInviteCodeAsync()
    {
        if (string.IsNullOrWhiteSpace(InviteCode))
        {
            await DialogService.ShowAlertAsync("Код не найден", "Не удалось найти код приглашения для копирования.", "OK");
            return;
        }

        try
        {
            await _clipboardService.SetTextAsync(InviteCode);
            await DialogService.ShowAlertAsync("Готово", "Код приглашения скопирован в буфер обмена.", "Отлично");
        }
        catch
        {
            await DialogService.ShowAlertAsync("Ошибка", "Не удалось скопировать код. Попробуй ещё раз.", "OK");
        }
    }

    private async Task OnLogoutAsync()
    {
        if (IsBusy)
        {
            return;
        }

        IsBusy = true;
        UpdateCommandStates();

        try
        {
            var confirm = await DialogService.ShowConfirmationAsync(
                "Выйти из аккаунта",
                "Ты уверен, что хочешь выйти?",
                "Да, выйти",
                "Отмена");

            if (!confirm)
            {
                return;
            }

            _shellHostService.HideNavigation();
            await NavigationService.GoToAsync("//welcome");
        }
        finally
        {
            IsBusy = false;
            UpdateCommandStates();
        }
    }

    private async Task OnViewStatisticsAsync()
    {
        _shellHostService.ShowMainNavigation();
        var switched = await _shellHostService.SwitchToTabAsync("stats", "parent_stats");
        if (!switched)
        {
            await NavigationService.GoToAsync("//stats/parent_stats");
        }
    }

    private async Task OnManageFamilyAsync()
    {
        await DialogService.ShowAlertAsync("Скоро", "Управление семьёй появится в будущих версиях приложения.", "Жду");
    }

    private async Task OnOpenRewardsAsync()
    {
        _shellHostService.ShowMainNavigation();
        var switched = await _shellHostService.SwitchToTabAsync("rewards", "rewards_shop");
        if (!switched)
        {
            await NavigationService.GoToAsync("//rewards/rewards_shop");
        }
    }

    private void UpdateCommandStates()
    {
        _editProfileCommand.RaiseCanExecuteChanged();
        _copyInviteCodeCommand.RaiseCanExecuteChanged();
        _logoutCommand.RaiseCanExecuteChanged();
        _viewStatisticsCommand.RaiseCanExecuteChanged();
        _manageFamilyCommand.RaiseCanExecuteChanged();
        _openRewardsCommand.RaiseCanExecuteChanged();
    }
}
