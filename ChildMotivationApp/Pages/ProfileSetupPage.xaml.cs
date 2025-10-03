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
        SetupForRole();
    }

    private void SetupForRole()
    {
        if (RoleLabel == null || AvatarBorder == null || AgeSection == null || RoleBadge == null || AvatarIcon == null)
            return;

        if (_isChild)
        {
            // Child - розовый
            PageTitleLabel.Text = "Расскажи о себе";
            PageSubtitleLabel.Text = "Создай свой профиль";
            RoleLabel.Text = "Ребёнок";

            // ФОТО РЕБЁНКА
            AvatarIcon.Source = "child.png";
            AvatarIcon.WidthRequest = 60;
            AvatarIcon.HeightRequest = 60;
            
            AvatarBorder.BackgroundColor = Color.FromArgb("#D946EF");
            RoleBadge.BackgroundColor = Color.FromArgb("#FAE8FF");
            RoleLabel.TextColor = Color.FromArgb("#D946EF");

            // Градиент для кнопки (розовый)
            ContinueButton.Background = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 0),
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#D946EF"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#EC4899"), Offset = 1 }
                }
            };

            AgeEntry.Text = _currentAge.ToString();
            AgeSection.IsVisible = true;
        }
        else
        {
            // Parent - синий
            PageTitleLabel.Text = "Расскажи о себе";
            PageSubtitleLabel.Text = "Создай свой профиль";
            RoleLabel.Text = "Родитель";

            // ФОТО РОДИТЕЛЯ
            AvatarIcon.Source = "parent.png";
            AvatarIcon.WidthRequest = 60;
            AvatarIcon.HeightRequest = 60;
            
            AvatarBorder.BackgroundColor = Color.FromArgb("#3B82F6");
            RoleBadge.BackgroundColor = Color.FromArgb("#EFF6FF");
            RoleLabel.TextColor = Color.FromArgb("#3B82F6");

            // Градиент для кнопки (синий)
            ContinueButton.Background = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 0),
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#3B82F6"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#60A5FA"), Offset = 1 }
                }
            };

            AgeSection.IsVisible = false;
        }
    }

    private async void OnDecreaseAgeClicked(object sender, EventArgs e)
    {
        if (_currentAge > 3)
        {
            _currentAge--;
            AgeEntry.Text = _currentAge.ToString();
        }
    }

    private async void OnIncreaseAgeClicked(object sender, EventArgs e)
    {
        if (_currentAge < 18)
        {
            _currentAge++;
            AgeEntry.Text = _currentAge.ToString();
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
                shell.ShowMainNavigation();
                await Task.Delay(100);
            }
            
            // Переход через Shell.Current.CurrentItem
            if (Shell.Current.Items.Count > 0)
            {
                Shell.Current.CurrentItem = Shell.Current.Items[0];
            }
        }
        else
        {
            await Shell.Current.GoToAsync($"//createfamily?parentName={Uri.EscapeDataString(name)}");
        }
        
        ContinueButton.IsEnabled = true;
    }
}