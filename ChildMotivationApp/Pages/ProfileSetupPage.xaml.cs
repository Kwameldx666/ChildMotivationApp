using System.Collections.Generic;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class ProfileSetupPage : ContentPage, IQueryAttributable
{
    private readonly ProfileSetupPageViewModel _viewModel;

    public ProfileSetupPage()
        : this(ServiceHelper.GetRequiredService<ProfileSetupPageViewModel>())
    {
    }

    public ProfileSetupPage(ProfileSetupPageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("role", out var roleValue) && roleValue is string role)
        {
            _viewModel.Role = role;
        }
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _ = _viewModel.OnAppearingAsync();
    }

    protected override void OnDisappearing()
    {

        // Validate
        if (string.IsNullOrWhiteSpace(NameEntry.Text))
        {
            await DisplayAlert("Ошибка", "Пожалуйста, введи своё имя", "OK");
            return;
        }

        if (_isChild && (string.IsNullOrWhiteSpace(AgeEntry.Text) || !int.TryParse(AgeEntry.Text, out int age) || age < 3 || age > 18))
        {
            await DisplayAlert("Ошибка", "Пожалуйста, введи корректный возраст (3-18)", "OK");
            return;
        }

        // Простая анимация
        ContinueButton.IsEnabled = false;
        ContinueButton.BackgroundColor = Color.FromArgb("#10B981");
        await Task.Delay(300);

        var name = NameEntry.Text.Trim();
        
        // Навигация
        if (_isChild)
        {
            if (Application.Current?.MainPage is AppShell shell)
            {
                shell.ShowMainNavigation(true);
                await Task.Delay(100);
            }
        }
        else
        {
            await Shell.Current.GoToAsync($"//createfamily?parentName={Uri.EscapeDataString(name)}");
        }
        
        ContinueButton.IsEnabled = true;

    }
}