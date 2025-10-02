using ChildMotivationApp.Pages.Base;
using ChildMotivationApp.Helpers;

namespace ChildMotivationApp.Pages;

[QueryProperty(nameof(ParentName), "parentName")]
[QueryProperty(nameof(FamilyName), "familyName")]
public partial class DashboardPage : ResponsiveContentPage
{
    private string _parentName = string.Empty;
    private string _familyName = string.Empty;
    private bool _isAnimating = false;

    public string ParentName
    {
        get => _parentName;
        set => _parentName = value ?? string.Empty;
    }

    public string FamilyName
    {
        get => _familyName;
        set => _familyName = value ?? string.Empty;
    }

    public DashboardPage()
    {
        InitializeComponent();
        InitializeResponsiveStyles();
        LoadData();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        UpdateUI();
        StartSubtleAnimations();
    }

    protected override void OnDisappearing()
    {
        _isAnimating = false;
        base.OnDisappearing();
    }

    protected override void ApplyResponsiveStyles()
    {
        // ?????????? ???????
        if (MainContentContainer != null)
        {
            var bottomPadding = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 100, // ????????? ??? TabBar
                ResponsiveDeviceType.Tablet => 80,
                ResponsiveDeviceType.Desktop => 40,
                _ => 100
            };

            var sidePadding = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 16, // ????????? ??? ????????
                ResponsiveDeviceType.Tablet => 28,
                ResponsiveDeviceType.Desktop => 40,
                _ => 16
            };

            var topPadding = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 20, // ????????? ??? ????????
                ResponsiveDeviceType.Tablet => 32,
                ResponsiveDeviceType.Desktop => 40,
                _ => 20
            };

            MainContentContainer.Padding = new Thickness(sidePadding, topPadding, sidePadding, bottomPadding);
            
            // ?????????? spacing
            MainContentContainer.Spacing = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 16,
                ResponsiveDeviceType.Tablet => 20,
                ResponsiveDeviceType.Desktop => 24,
                _ => 16
            };
        }

        // ?????????? ?????? ???????
        if (MainAvatar != null)
        {
            var size = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 80, // ????????? ??? ????????
                ResponsiveDeviceType.Tablet => 110,
                ResponsiveDeviceType.Desktop => 130,
                _ => 80
            };

            MainAvatar.WidthRequest = size;
            MainAvatar.HeightRequest = size;
            
            // ?????????? ?????? ?????? ???????
            if (UserAvatarLabel != null)
            {
                UserAvatarLabel.FontSize = CurrentDeviceType switch
                {
                    ResponsiveDeviceType.Mobile => 32,
                    ResponsiveDeviceType.Tablet => 40,
                    ResponsiveDeviceType.Desktop => 48,
                    _ => 32
                };
            }
        }

        // ?????????? ?????? Welcome Label
        if (WelcomeLabel != null)
        {
            WelcomeLabel.FontSize = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 22,
                ResponsiveDeviceType.Tablet => 26,
                ResponsiveDeviceType.Desktop => 28,
                _ => 22
            };
        }

        // ?????????? ????? ??????????
        if (StatsGrid != null)
        {
            if (CurrentDeviceType == ResponsiveDeviceType.Desktop)
            {
                // ?? ???????? ?????? 4 ??????? ? 1 ???
                StatsGrid.ColumnDefinitions.Clear();
                StatsGrid.RowDefinitions.Clear();
                
                for (int i = 0; i < 4; i++)
                {
                    StatsGrid.ColumnDefinitions.Add(new ColumnDefinition(GridLength.Star));
                }
                StatsGrid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
                
                Grid.SetColumn(TotalTasksCard, 0);
                Grid.SetRow(TotalTasksCard, 0);
                Grid.SetColumn(PendingTasksCard, 1);
                Grid.SetRow(PendingTasksCard, 0);
                Grid.SetColumn(OverdueTasksCard, 2);
                Grid.SetRow(OverdueTasksCard, 0);
                Grid.SetColumn(SuccessRateCard, 3);
                Grid.SetRow(SuccessRateCard, 0);
                
                StatsGrid.ColumnSpacing = 20;
            }
            else
            {
                // ?? ????????? ? ????????? - 2x2
                StatsGrid.ColumnDefinitions.Clear();
                StatsGrid.RowDefinitions.Clear();
                
                StatsGrid.ColumnDefinitions.Add(new ColumnDefinition(GridLength.Star));
                StatsGrid.ColumnDefinitions.Add(new ColumnDefinition(GridLength.Star));
                StatsGrid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
                StatsGrid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
                
                Grid.SetColumn(TotalTasksCard, 0);
                Grid.SetRow(TotalTasksCard, 0);
                Grid.SetColumn(PendingTasksCard, 1);
                Grid.SetRow(PendingTasksCard, 0);
                Grid.SetColumn(OverdueTasksCard, 0);
                Grid.SetRow(OverdueTasksCard, 1);
                Grid.SetColumn(SuccessRateCard, 1);
                Grid.SetRow(SuccessRateCard, 1);
                
                StatsGrid.ColumnSpacing = CurrentDeviceType == ResponsiveDeviceType.Mobile ? 12 : 16;
                StatsGrid.RowSpacing = CurrentDeviceType == ResponsiveDeviceType.Mobile ? 12 : 16;
            }
            
            // ?????????? ??????? ???????? ??????????
            var cardPadding = CurrentDeviceType switch
            {
                ResponsiveDeviceType.Mobile => 14,
                ResponsiveDeviceType.Tablet => 18,
                ResponsiveDeviceType.Desktop => 20,
                _ => 14
            };
            
            foreach (var card in new[] { TotalTasksCard, PendingTasksCard, OverdueTasksCard, SuccessRateCard })
            {
                if (card != null)
                {
                    card.Padding = cardPadding;
                    
                    // ?????????? ?????? ????
                    card.CornerRadius = CurrentDeviceType switch
                    {
                        ResponsiveDeviceType.Mobile => 20,
                        ResponsiveDeviceType.Tablet => 22,
                        ResponsiveDeviceType.Desktop => 24,
                        _ => 20
                    };
                }
            }
        }
    }

    private void LoadData()
    {
        // ????????? ???????? ??????
        if (TotalTasksLabel != null) TotalTasksLabel.Text = "12";
        if (PendingTasksLabel != null) PendingTasksLabel.Text = "3";
        if (OverdueTasksLabel != null) OverdueTasksLabel.Text = "1";
        if (SuccessRateLabel != null) SuccessRateLabel.Text = "85%";
    }

    private void UpdateUI()
    {
        // Update avatar with first letter of name
        if (!string.IsNullOrEmpty(_parentName))
        {
            var firstLetter = _parentName.Substring(0, 1).ToUpper();
            if (UserAvatarLabel != null) UserAvatarLabel.Text = firstLetter;
            if (WelcomeLabel != null) WelcomeLabel.Text = $"Welcome back, {_parentName}! ??";
        }
        else
        {
            if (UserAvatarLabel != null) UserAvatarLabel.Text = "A";
            if (WelcomeLabel != null) WelcomeLabel.Text = "Welcome back! ??";
        }

        // Update family name
        if (!string.IsNullOrEmpty(_familyName))
        {
            if (FamilyInfoLabel != null) FamilyInfoLabel.Text = $"The {_familyName}";
        }
        else
        {
            if (FamilyInfoLabel != null) FamilyInfoLabel.Text = "The Amazing Family";
        }

        if (MembersCountLabel != null) MembersCountLabel.Text = "1 active member";
    }

    private async void StartSubtleAnimations()
    {
        if (_isAnimating) return;
        _isAnimating = true;

        // Subtle avatar glow animation
        _ = Task.Run(async () =>
        {
            while (_isAnimating && Application.Current != null)
            {
                await MainThread.InvokeOnMainThreadAsync(async () =>
                {
                    if (MainAvatar != null)
                    {
                        await MainAvatar.ScaleTo(1.03, 2000, Easing.SinInOut);
                        await MainAvatar.ScaleTo(1.0, 2000, Easing.SinInOut);
                    }
                });
                await Task.Delay(4000);
            }
        });
    }

    private async void OnCreateTaskClicked(object sender, EventArgs e)
    {
        // Beautiful button animation
        if (sender is Button button)
        {
            await button.ScaleTo(0.95, 100, Easing.CubicOut);
            await button.ScaleTo(1.0, 100, Easing.CubicOut);
        }

        // Show modal for creating task
        if (CreateTaskModal != null)
        {
            await CreateTaskModal.ShowAsync();
        }
    }

    private void OnTaskCreated(object? sender, EventArgs e)
    {
        // Handle task creation - refresh statistics
        LoadData();
        
        // ????? ???????? ???????? ??????????
        MainThread.BeginInvokeOnMainThread(async () =>
        {
            if (StatsGrid != null)
            {
                await StatsGrid.ScaleTo(1.05, 200, Easing.CubicOut);
                await StatsGrid.ScaleTo(1.0, 200, Easing.CubicOut);
            }
        });
    }

    private void OnModalClosed(object? sender, EventArgs e)
    {
        // Handle modal closure if needed
    }
}