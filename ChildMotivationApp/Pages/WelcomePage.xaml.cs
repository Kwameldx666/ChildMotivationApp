using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class WelcomePage : ContentPage
{
    public WelcomePage()
    {
        InitializeComponent();
    }

    private async void OnStartClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            button.BackgroundColor = Color.FromArgb("#10B981");
            await Task.Delay(200);
        }

        await Shell.Current.GoToAsync("//roleselection");
    }
}