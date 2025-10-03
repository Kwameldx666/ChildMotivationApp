using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

[QueryProperty(nameof(ParentName), "parentName")]
[QueryProperty(nameof(FamilyName), "familyName")]
public partial class DashboardPage : ContentPage
{
    private string _parentName = string.Empty;
    private string _familyName = string.Empty;

    public string ParentName
    {
        get => _parentName;
        set
        {
            _parentName = value ?? string.Empty;
            // ? ??????? ???????? ??? ??????????? ????? ??? ???????????
        }
    }

    public string FamilyName
    {
        get => _familyName;
        set => _familyName = value ?? string.Empty;
    }

    public DashboardPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // ??? ????????, ?.?. ??????????? ????????? ???
    }

    private async void OnCreateTaskClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            await button.ScaleTo(0.95, 100);
            await button.ScaleTo(1, 100);
        }

        var modal = new CreateTaskModal();
        await Navigation.PushModalAsync(modal);
    }
}