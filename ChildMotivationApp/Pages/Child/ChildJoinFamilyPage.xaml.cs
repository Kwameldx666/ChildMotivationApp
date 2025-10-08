using ChildMotivationApp;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages.Child;

[QueryProperty(nameof(ChildName), "childName")]
[QueryProperty(nameof(ChildAge), "childAge")]
public partial class ChildJoinFamilyPage : ContentPage
{
    private string? _childName;
    private string? _childAge;

    public string? ChildName
    {
        get => _childName;
        set
        {
            _childName = value;
            UpdateGreeting();
        }
    }

    public string? ChildAge
    {
        get => _childAge;
        set
        {
            _childAge = value;
            UpdateGreeting();
        }
    }

    public ChildJoinFamilyPage()
    {
        InitializeComponent();
    }

    private void UpdateGreeting()
    {
        var name = string.IsNullOrWhiteSpace(_childName) ? null : _childName.Trim();
        GreetingLabel.Text = !string.IsNullOrEmpty(name)
            ? $"{name}, присоединись к семье"
            : "Присоединись к семье";

        var ageText = string.IsNullOrWhiteSpace(_childAge)
            ? string.Empty
            : $"Тебе {_childAge} лет. ";

        SubtitleLabel.Text = $"{ageText}Введи код приглашения от родителей".Trim();
    }

    private async void OnJoinFamilyClicked(object sender, EventArgs e)
    {
        var code = InviteCodeEntry.Text?.Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(code))
        {
            await DisplayAlert("Ой!", "Пожалуйста, введи код приглашения", "Понятно");
            return;
        }

        await DisplayAlert("Ура!", $"Код {code} принят. Скоро здесь появится твоя семья!", "Отлично");

        if (Application.Current?.MainPage is AppShell shell)
        {
            shell.ShowMainNavigation(true);
            await Shell.Current.GoToAsync("//child_home");
        }
    }

    private async void OnSkipClicked(object sender, EventArgs e)
    {
        if (Application.Current?.MainPage is AppShell shell)
        {
            shell.ShowMainNavigation(true);
            await Shell.Current.GoToAsync("//child_home");
        }
    }
}
