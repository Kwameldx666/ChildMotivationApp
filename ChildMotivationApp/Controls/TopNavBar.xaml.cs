using System.Threading.Tasks;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.Services;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Controls;

public partial class TopNavBar : ContentView
{
    private readonly INavigationService _navigationService;
    private readonly IModalService _modalService;
    private readonly IShellHostService _shellHostService;

    public TopNavBar()
    {
        InitializeComponent();
        _navigationService = ServiceHelper.GetRequiredService<INavigationService>();
        _modalService = ServiceHelper.GetRequiredService<IModalService>();
        _shellHostService = ServiceHelper.GetRequiredService<IShellHostService>();
        UpdateStates("home");
    }

    // Simple visual states via Bindable properties (backing with Colors)
    public Color HomeBg { get; set; } = Colors.Transparent;
    public Color RewardsBg { get; set; } = Colors.Transparent;
    public Color StatsBg { get; set; } = Colors.Transparent;
    public Color ProfileBg { get; set; } = Colors.Transparent;

    public Color HomeText { get; set; } = Color.FromArgb("#6B7280");
    public Color RewardsText { get; set; } = Color.FromArgb("#6B7280");
    public Color StatsText { get; set; } = Color.FromArgb("#6B7280");
    public Color ProfileText { get; set; } = Color.FromArgb("#6B7280");

    public static readonly BindableProperty ActiveTabProperty = BindableProperty.Create(
        nameof(ActiveTab),
        typeof(string),
        typeof(TopNavBar),
        "home",
        propertyChanged: OnActiveTabChanged);

    public string ActiveTab
    {
        get => (string)GetValue(ActiveTabProperty);
        set => SetValue(ActiveTabProperty, value);
    }

    private static void OnActiveTabChanged(BindableObject bindable, object? oldValue, object? newValue)
    {
        if (bindable is TopNavBar navBar)
        {
            var active = newValue as string;
            if (string.IsNullOrWhiteSpace(active))
            {
                active = "home";
            }

            navBar.UpdateStates(active);
        }
    }

    private void UpdateStates(string active)
    {
        if (string.IsNullOrWhiteSpace(active))
        {
            active = "home";
        }

        active = active.ToLowerInvariant();

        HomeBg = RewardsBg = StatsBg = ProfileBg = Colors.Transparent;
        HomeText = RewardsText = StatsText = ProfileText = Color.FromArgb("#6B7280");

        switch (active)
        {
            case "home": HomeBg = Color.FromArgb("#E0E7FF"); HomeText = Color.FromArgb("#3B82F6"); break;
            case "rewards": RewardsBg = Color.FromArgb("#E0E7FF"); RewardsText = Color.FromArgb("#3B82F6"); break;
            case "stats": StatsBg = Color.FromArgb("#E0E7FF"); StatsText = Color.FromArgb("#3B82F6"); break;
            case "profile": ProfileBg = Color.FromArgb("#E0E7FF"); ProfileText = Color.FromArgb("#3B82F6"); break;
        }

        OnPropertyChanged(nameof(HomeBg));
        OnPropertyChanged(nameof(RewardsBg));
        OnPropertyChanged(nameof(StatsBg));
        OnPropertyChanged(nameof(ProfileBg));
        OnPropertyChanged(nameof(HomeText));
        OnPropertyChanged(nameof(RewardsText));
        OnPropertyChanged(nameof(StatsText));
        OnPropertyChanged(nameof(ProfileText));
    }

    private async void OnHomeTapped(object? sender, EventArgs e)
    {
        UpdateStates("home");
        _shellHostService.ShowMainNavigation();
        var switched = await _shellHostService.SwitchToTabAsync("home", "dashboard");
        if (!switched)
        {
            await TryGoToAsync("//home/dashboard");
        }
    }

    private async void OnRewardsTapped(object? sender, EventArgs e)
    {
        UpdateStates("rewards");
        _shellHostService.ShowMainNavigation();
        var switched = await _shellHostService.SwitchToTabAsync("rewards", "rewards_shop");
        if (!switched)
        {
            await TryGoToAsync("//rewards/rewards_shop");
        }
    }

    private async void OnStatsTapped(object? sender, EventArgs e)
    {
        UpdateStates("stats");
        _shellHostService.ShowMainNavigation();
        var switched = await _shellHostService.SwitchToTabAsync("stats", "parent_stats");
        if (!switched)
        {
            await TryGoToAsync("//stats/parent_stats");
        }
    }

    private async void OnProfileTapped(object? sender, EventArgs e)
    {
        UpdateStates("profile");
        _shellHostService.ShowMainNavigation();
        var switched = await _shellHostService.SwitchToTabAsync("profile", "parent_profile");
        if (!switched)
        {
            await TryGoToAsync("//profile/parent_profile");
        }
    }

    private async Task<bool> TryGoToAsync(string route)
    {
        try
        {
            await _navigationService.GoToAsync(route);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async void OnAddTapped(object? sender, EventArgs e)
    {
        try
        {
            await _modalService.ShowCreateTaskModalAsync();
        }
        catch
        {
            var switched = await _shellHostService.SwitchToTabAsync("home", "dashboard");
            if (!switched)
            {
                await TryGoToAsync("//home/dashboard");
            }
        }
    }
}
