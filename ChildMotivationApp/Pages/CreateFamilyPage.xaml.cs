using ChildMotivationApp.Helpers;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

[QueryProperty(nameof(ParentName), "parentName")]
public partial class CreateFamilyPage : ContentPage
{
    private string _parentName = string.Empty;
    private bool _isAnimating = false;

    public string ParentName
    {
        get => _parentName;
        set => _parentName = value ?? string.Empty;
    }

    public CreateFamilyPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _isAnimating = true;
        StartEntranceAnimations();
    }

    protected override void OnDisappearing()
    {
        _isAnimating = false;
        base.OnDisappearing();
    }

    private async void StartEntranceAnimations()
    {
        // ????????? ?????????
        MainCard.Opacity = 0;
        MainCard.Scale = 0.85;
        MainCard.TranslationY = 50;

        HouseIcon.Opacity = 0;
        HouseIcon.Scale = 0.3;
        HouseIcon.TranslationY = -40;

        HeaderSection.Opacity = 0;
        HeaderSection.TranslationY = 20;

        FormSection.Opacity = 0;
        FormSection.TranslationX = -30;

        CreateButtonBorder.Opacity = 0;
        CreateButtonBorder.Scale = 0.8;

        await Task.Delay(100);

        // ???????? ????????
        await Task.WhenAll(
            MainCard.FadeTo(1, 800, Easing.CubicOut),
            MainCard.ScaleTo(1, 900, Easing.SpringOut),
            MainCard.TranslateTo(0, 0, 800, Easing.CubicOut)
        );

        // ???????? ?????? ? ?????????
        await Task.Delay(100);
        await Task.WhenAll(
            HouseIcon.FadeTo(1, 700, Easing.CubicOut),
            HouseIcon.ScaleTo(1, 1100, Easing.SpringOut),
            HouseIcon.TranslateTo(0, 0, 700, Easing.CubicOut),
            HouseIcon.RotateTo(360, 1000, Easing.CubicOut)
        );

        // ???????? ?????????
        await Task.Delay(100);
        await Task.WhenAll(
            HeaderSection.FadeTo(1, 600, Easing.CubicOut),
            HeaderSection.TranslateTo(0, 0, 600, Easing.CubicOut)
        );

        // ???????? ?????
        await Task.Delay(150);
        await Task.WhenAll(
            FormSection.FadeTo(1, 600, Easing.CubicOut),
            FormSection.TranslateTo(0, 0, 600, Easing.CubicOut)
        );

        // ???????? ??????
        await Task.Delay(100);
        await Task.WhenAll(
            CreateButtonBorder.FadeTo(1, 500, Easing.CubicOut),
            CreateButtonBorder.ScaleTo(1, 700, Easing.SpringOut)
        );

        // Continuous animations
        _ = ContinuousAnimations();
    }

    private async Task ContinuousAnimations()
    {
        // ??????? ????????? ??????
        while (_isAnimating)
        {
            await HouseIcon.ScaleTo(1.06, 2000, Easing.SinInOut);
            if (_isAnimating)
                await HouseIcon.ScaleTo(1.0, 2000, Easing.SinInOut);
        }
    }

    private async void OnCreateFamilyClicked(object sender, EventArgs e)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(FamilyNameEntry.Text))
        {
            // ???????? ?????? - ??????
            for (int i = 0; i < 3; i++)
            {
                await FamilyNameEntry.TranslateTo(-10, 0, 50);
                await FamilyNameEntry.TranslateTo(10, 0, 50);
            }
            await FamilyNameEntry.TranslateTo(0, 0, 50);
            
            await DisplayAlert("Error", "Please enter a family name", "OK");
            return;
        }

        var familyName = FamilyNameEntry.Text.Trim();

        if (familyName.Length < 2)
        {
            await DisplayAlert("Error", "Family name must be at least 2 characters long", "OK");
            return;
        }

        if (familyName.Length > 50)
        {
            await DisplayAlert("Error", "Family name must be less than 50 characters", "OK");
            return;
        }

        // ??????? ???????? ??????
        CreateFamilyButton.IsEnabled = false;
        
        await CreateButtonBorder.ScaleTo(0.92, 100, Easing.CubicIn);
        
        // ???????? ?? ??????? ????????
        CreateButtonBorder.Background = new LinearGradientBrush
        {
            StartPoint = new Point(0, 0),
            EndPoint = new Point(1, 0),
            GradientStops = new GradientStopCollection
            {
                new GradientStop { Color = Color.FromArgb("#10B981"), Offset = 0 },
                new GradientStop { Color = Color.FromArgb("#34D399"), Offset = 1 }
            }
        };
        CreateFamilyButton.TextColor = Colors.White;
        
        await CreateButtonBorder.ScaleTo(1.05, 150, Easing.SpringOut);
        
        // ????????? ??????
        for (int i = 0; i < 2; i++)
        {
            await CreateButtonBorder.ScaleTo(1.08, 150, Easing.CubicOut);
            await CreateButtonBorder.ScaleTo(1.05, 150, Easing.CubicOut);
        }

        // ???????? "??????" ??????
        _ = Task.Run(async () =>
        {
            await MainThread.InvokeOnMainThreadAsync(async () =>
            {
                await HouseIcon.ScaleTo(1.3, 300, Easing.CubicOut);
                await HouseIcon.TranslateTo(0, -30, 300, Easing.CubicOut);
            });
        });

        await Task.Delay(100);

        // Show success
        var message = string.IsNullOrEmpty(_parentName) 
            ? $"Welcome to {familyName}! ??" 
            : $"Great, {_parentName}! Welcome to {familyName}! ??";
        
        await DisplayAlert("Family Created", message, "Continue");

        // Enable navigation
        if (Application.Current?.MainPage is AppShell shell)
        {
            shell.ShowMainNavigation();
        }
        
        // ???????????? ????????? - ?????????? ???????!
        // //main - ??? TabBar, ?????? tab (dashboard) ?????????? ?????????????
        await Shell.Current.GoToAsync("//main");
        
        CreateFamilyButton.IsEnabled = true;
    }
}