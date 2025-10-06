using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Controls;

public partial class TopNavBar : ContentView
{
    public TopNavBar()
    {
        InitializeComponent();
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

    private void UpdateStates(string active)
    {
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
        var ok = await TryGoToAsync("//home/dashboard");
        if (!ok)
            await Shell.Current.GoToAsync("dashboard");
    }

    private async void OnRewardsTapped(object? sender, EventArgs e)
    {
        UpdateStates("rewards");
        var ok = await TryGoToAsync("//rewards/rewards_shop");
        if (!ok)
            await Shell.Current.GoToAsync("rewards_shop");
    }

    private async void OnStatsTapped(object? sender, EventArgs e)
    {
        UpdateStates("stats");
        var ok = await TryGoToAsync("//stats/parent_stats");
        if (!ok)
            await Shell.Current.GoToAsync("parent_stats");
    }

    private async void OnProfileTapped(object? sender, EventArgs e)
    {
        UpdateStates("profile");
        var ok = await TryGoToAsync("//profile/parent_profile");
        if (!ok)
            await Shell.Current.GoToAsync("parent_profile");
    }

    private async Task<bool> TryGoToAsync(string route)
    {
        try
        {
            await Shell.Current.GoToAsync(route);
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
            await Shell.Current.CurrentPage.Navigation.PushModalAsync(new Pages.CreateTaskModal());
        }
        catch
        {
            await Shell.Current.GoToAsync("dashboard");
        }
    }
}
