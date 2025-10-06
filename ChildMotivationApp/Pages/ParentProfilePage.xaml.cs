using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class ParentProfilePage : ContentPage
{
    public ParentProfilePage()
    {
        InitializeComponent();
        LoadProfileData();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        LoadProfileData();
    }

    private void LoadProfileData()
    {
        // TODO: Load profile data from database or API
        // For now, using sample data
        NameLabel.Text = "panpo";
        UserNameLabel.Text = "panpo";
        FamilyNameLabel.Text = "panpo";
    }

    private async void OnEditProfileClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            await button.ScaleTo(0.95, 100);
            await button.ScaleTo(1, 100);
        }

        await DisplayAlert("Редактировать профиль", "Функция редактирования профиля скоро будет доступна", "OK");
    }

    private async void OnCopyCodeClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            await button.ScaleTo(0.95, 100);
            await button.ScaleTo(1, 100);
        }

        try
        {
            await Clipboard.SetTextAsync("TA8EYT");
            await DisplayAlert("? Скопировано", "Код приглашения скопирован в буфер обмена", "OK");
        }
        catch
        {
            await DisplayAlert("Ошибка", "Не удалось скопировать код", "OK");
        }
    }

    private async void OnLogoutClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            await button.ScaleTo(0.95, 100);
            await button.ScaleTo(1, 100);
        }

        bool confirm = await DisplayAlert(
            "Выход из аккаунта",
            "Вы уверены, что хотите выйти?",
            "Да, выйти",
            "Отмена"
        );

        if (confirm)
        {
            // TODO: Clear user session, preferences, etc.
            
            // Navigate to welcome page
            if (Application.Current?.MainPage is AppShell shell)
            {
                shell.HideNavigation();
            }
            
            await Shell.Current.GoToAsync("//welcome");
        }
    }
}
