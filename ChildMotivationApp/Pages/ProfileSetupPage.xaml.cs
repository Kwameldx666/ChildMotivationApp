using ChildMotivationApp.Pages.Base;
using ChildMotivationApp.Helpers;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Shapes;

namespace ChildMotivationApp.Pages;

[QueryProperty(nameof(Role), "role")]
public partial class ProfileSetupPage : ContentPage
{
    private string _userRole = "Parent";
    private bool _isChild = false;
    private int _currentAge = 8;
    private bool _isAnimating = false;

    public string Role
    {
        get => _userRole;
        set
        {
            _userRole = value ?? "Parent";
            _isChild = _userRole.Equals("Child", StringComparison.OrdinalIgnoreCase);
        }
    }

    public ProfileSetupPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _isAnimating = true;
        SetupForRole();
        StartEntranceAnimations();
    }

    protected override void OnDisappearing()
    {
        _isAnimating = false;
        base.OnDisappearing();
    }

    private void SetupForRole()
    {
        if (RoleLabel == null || AvatarBorder == null || AgeSection == null || RoleBadge == null)
            return;

        if (_isChild)
        {
            // Child setup - розово-фиолетовые цвета
            PageTitleLabel.Text = "About You";
            PageSubtitleLabel.Text = "Tell us about yourself! 🎈";
            RoleLabel.Text = "Child 👧";
            AvatarIcon.Text = "👧";
            RoleBadge.BackgroundColor = Color.FromArgb("#40FF69B4");
            RoleBadge.Stroke = Color.FromArgb("#60FF69B4");
            RoleLabel.TextColor = Colors.White;
            
            AvatarBorder.Background = new RadialGradientBrush
            {
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#8B5CF6"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#EC4899"), Offset = 1 }
                }
            };

            AvatarBorder.Shadow = new Shadow
            {
                Brush = Color.FromArgb("#60EC4899"),
                Radius = 30,
                Offset = new Point(0, 15)
            };

            var avatarGlow = this.FindByName<Ellipse>("AvatarGlow");
            if (avatarGlow != null)
            {
                avatarGlow.Fill = Color.FromArgb("#40EC4899");
            }

            AgeEntry.Text = _currentAge.ToString();
            AgeSection.IsVisible = true;
        }
        else
        {
            // Parent setup - золотые цвета
            PageTitleLabel.Text = "About You";
            PageSubtitleLabel.Text = "Create your parent profile 👨‍👩";
            RoleLabel.Text = "Parent 👨‍👩";
            AvatarIcon.Text = "👨‍👩";
            RoleBadge.BackgroundColor = Color.FromArgb("#40FFD700");
            RoleBadge.Stroke = Color.FromArgb("#60FFD700");
            RoleLabel.TextColor = Colors.White;
            
            AvatarBorder.Background = new RadialGradientBrush
            {
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#FFD700"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#FFA500"), Offset = 1 }
                }
            };

            AvatarBorder.Shadow = new Shadow
            {
                Brush = Color.FromArgb("#60FFD700"),
                Radius = 30,
                Offset = new Point(0, 15)
            };

            var avatarGlow = this.FindByName<Ellipse>("AvatarGlow");
            if (avatarGlow != null)
            {
                avatarGlow.Fill = Color.FromArgb("#40FFD700");
            }

            AgeSection.IsVisible = false;
        }
    }

    private async void StartEntranceAnimations()
    {
        // Начальное состояние
        MainCard.Opacity = 0;
        MainCard.Scale = 0.85;
        MainCard.TranslationY = 50;

        HeaderSection.Opacity = 0;
        HeaderSection.TranslationY = -20;

        AvatarSection.Opacity = 0;
        AvatarSection.Scale = 0.3;

        FormSection.Opacity = 0;
        FormSection.TranslationY = 30;

        ContinueButtonBorder.Opacity = 0;
        ContinueButtonBorder.Scale = 0.8;

        await Task.Delay(100);

        // Анимация карточки
        await Task.WhenAll(
            MainCard.FadeTo(1, 800, Easing.CubicOut),
            MainCard.ScaleTo(1, 900, Easing.SpringOut),
            MainCard.TranslateTo(0, 0, 800, Easing.CubicOut)
        );

        // Анимация заголовка
        await Task.Delay(100);
        await Task.WhenAll(
            HeaderSection.FadeTo(1, 600, Easing.CubicOut),
            HeaderSection.TranslateTo(0, 0, 600, Easing.CubicOut)
        );

        // Анимация аватара с вращением
        await Task.Delay(100);
        await Task.WhenAll(
            AvatarSection.FadeTo(1, 700, Easing.CubicOut),
            AvatarSection.ScaleTo(1, 1100, Easing.SpringOut),
            AvatarBorder.RotateTo(360, 1000, Easing.CubicOut)
        );

        // Анимация формы
        await Task.Delay(150);
        await Task.WhenAll(
            FormSection.FadeTo(1, 600, Easing.CubicOut),
            FormSection.TranslateTo(0, 0, 600, Easing.CubicOut)
        );

        // Анимация кнопки
        await Task.Delay(100);
        await Task.WhenAll(
            ContinueButtonBorder.FadeTo(1, 500, Easing.CubicOut),
            ContinueButtonBorder.ScaleTo(1, 700, Easing.SpringOut)
        );

        // Continuous animations
        _ = ContinuousAnimations();
    }

    private async Task ContinuousAnimations()
    {
        // Пульсация аватара
        while (_isAnimating)
        {
            await AvatarSection.ScaleTo(1.05, 2000, Easing.SinInOut);
            if (_isAnimating)
                await AvatarSection.ScaleTo(1.0, 2000, Easing.SinInOut);
        }
    }

    private async void OnDecreaseAgeClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            await button.ScaleTo(0.85, 80, Easing.CubicOut);
            await button.ScaleTo(1.0, 80, Easing.SpringOut);
        }
        
        if (_currentAge > 3)
        {
            _currentAge--;
            AgeEntry.Text = _currentAge.ToString();
            await AgeEntry.ScaleTo(1.15, 100, Easing.CubicOut);
            await AgeEntry.ScaleTo(1.0, 100, Easing.CubicOut);
        }
    }

    private async void OnIncreaseAgeClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            await button.ScaleTo(0.85, 80, Easing.CubicOut);
            await button.ScaleTo(1.0, 80, Easing.SpringOut);
        }
        
        if (_currentAge < 18)
        {
            _currentAge++;
            AgeEntry.Text = _currentAge.ToString();
            await AgeEntry.ScaleTo(1.15, 100, Easing.CubicOut);
            await AgeEntry.ScaleTo(1.0, 100, Easing.CubicOut);
        }
    }

    private void OnAgeTextChanged(object sender, TextChangedEventArgs e)
    {
        if (int.TryParse(e.NewTextValue, out int age))
        {
            if (age >= 3 && age <= 18)
            {
                _currentAge = age;
            }
            else if (age < 3)
            {
                _currentAge = 3;
                AgeEntry.Text = "3";
            }
            else if (age > 18)
            {
                _currentAge = 18;
                AgeEntry.Text = "18";
            }
        }
    }

    private async void OnContinueClicked(object sender, EventArgs e)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(NameEntry.Text))
        {
            await DisplayAlert("Error", "Please enter your name", "OK");
            return;
        }

        if (_isChild && (string.IsNullOrWhiteSpace(AgeEntry.Text) || !int.TryParse(AgeEntry.Text, out int age) || age < 3 || age > 18))
        {
            await DisplayAlert("Error", "Please enter a valid age (3-18)", "OK");
            return;
        }

        // Премиум анимация успеха
        ContinueButton.IsEnabled = false;
        
        await ContinueButtonBorder.ScaleTo(0.92, 100, Easing.CubicIn);
        
        ContinueButtonBorder.BackgroundColor = Color.FromArgb("#10B981");
        ContinueButton.TextColor = Colors.White;
        
        await ContinueButtonBorder.ScaleTo(1.05, 150, Easing.SpringOut);
        
        for (int i = 0; i < 2; i++)
        {
            await ContinueButtonBorder.ScaleTo(1.08, 150, Easing.CubicOut);
            await ContinueButtonBorder.ScaleTo(1.05, 150, Easing.CubicOut);
        }

        var name = NameEntry.Text.Trim();
        
        // ИСПРАВЛЕННАЯ НАВИГАЦИЯ
        if (_isChild)
        {
            if (Application.Current?.MainPage is AppShell shell)
            {
                shell.ShowMainNavigation();
            }
            // Правильный маршрут - только //main, dashboard загрузится автоматически
            await Shell.Current.GoToAsync("//main");
        }
        else
        {
            await Shell.Current.GoToAsync($"//createfamily?parentName={Uri.EscapeDataString(name)}");
        }
        
        ContinueButton.IsEnabled = true;
    }
}