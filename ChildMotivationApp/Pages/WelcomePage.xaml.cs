using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class WelcomePage : ContentPage
{
    private bool _isAnimating = false;

    public WelcomePage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _isAnimating = true;
        StartPremiumAnimations();
    }

    protected override void OnDisappearing()
    {
        _isAnimating = false;
        base.OnDisappearing();
    }

    private async void StartPremiumAnimations()
    {
        // ????????????? ????????? ?????????
        MainCard.Opacity = 0;
        MainCard.Scale = 0.85;
        MainCard.TranslationY = 50;

        HeroIcon.Opacity = 0;
        HeroIcon.Scale = 0.3;
        HeroIcon.TranslationY = -40;

        TitleSection.Opacity = 0;
        TitleSection.TranslationY = 30;

        FeaturesSection.Opacity = 0;
        FeaturesSection.TranslationY = 40;

        ActionButtonBorder.Opacity = 0;
        ActionButtonBorder.Scale = 0.8;

        await Task.Delay(100);

        // ???????? ???????? ? ???????? ????????
        await Task.WhenAll(
            MainCard.FadeTo(1, 800, Easing.CubicOut),
            MainCard.ScaleTo(1, 900, Easing.SpringOut),
            MainCard.TranslateTo(0, 0, 800, Easing.CubicOut)
        );

        // ???????? Hero Icon ? ????????? ? ??????? ????????
        await Task.Delay(100);
        await Task.WhenAll(
            HeroIcon.FadeTo(1, 700, Easing.CubicOut),
            HeroIcon.ScaleTo(1, 1100, Easing.SpringOut),
            HeroIcon.TranslateTo(0, 0, 700, Easing.CubicOut),
            HeroIcon.RotateTo(360, 1000, Easing.CubicOut)
        );

        // ???????? ????????? ? ???????? ??????
        await Task.Delay(150);
        await Task.WhenAll(
            TitleSection.FadeTo(1, 600, Easing.CubicOut),
            TitleSection.TranslateTo(0, 0, 600, Easing.CubicOut)
        );

        // ???????? ???????? ??????? ? ????????? ????????
        await Task.Delay(100);
        await Task.WhenAll(
            FeaturesSection.FadeTo(1, 700, Easing.CubicOut),
            FeaturesSection.TranslateTo(0, 0, 700, Easing.CubicOut)
        );

        // ???????? ?????? ? ??????????
        await Task.Delay(150);
        await Task.WhenAll(
            ActionButtonBorder.FadeTo(1, 500, Easing.CubicOut),
            ActionButtonBorder.ScaleTo(1, 700, Easing.SpringOut)
        );

        // ????????? ??????????? ????????
        _ = ContinuousAnimations();
    }

    private async Task ContinuousAnimations()
    {
        // ????????? Hero Icon
        _ = Task.Run(async () =>
        {
            while (_isAnimating)
            {
                await MainThread.InvokeOnMainThreadAsync(async () =>
                {
                    if (HeroIcon != null && _isAnimating)
                    {
                        await HeroIcon.ScaleTo(1.08, 2000, Easing.SinInOut);
                        if (_isAnimating)
                            await HeroIcon.ScaleTo(1.0, 2000, Easing.SinInOut);
                    }
                });
                await Task.Delay(100);
            }
        });

        // ????????? ??????
        await Task.Delay(1000);
        for (int i = 0; i < 3; i++)
        {
            if (!_isAnimating) break;

            await ActionButtonBorder.ScaleTo(1.05, 600, Easing.SinInOut);
            if (_isAnimating)
                await ActionButtonBorder.ScaleTo(1.0, 600, Easing.SinInOut);

            await Task.Delay(500);
        }
    }

    private async void OnStartClicked(object sender, EventArgs e)
    {
        if (sender is Button button)
        {
            // ????????? ??????
            button.IsEnabled = false;

            // ???????? ???????? ???????
            await ActionButtonBorder.ScaleTo(0.92, 100, Easing.CubicIn);

            // ???????? ???? ?? ???????? ? ??????????
            ActionButtonBorder.Background = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 0),
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#10B981"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#34D399"), Offset = 1 }
                }
            };

            button.TextColor = Colors.White;

            await ActionButtonBorder.ScaleTo(1.05, 150, Easing.SpringOut);

            // ????????? ??????
            for (int i = 0; i < 2; i++)
            {
                await ActionButtonBorder.ScaleTo(1.08, 150, Easing.CubicOut);
                await ActionButtonBorder.ScaleTo(1.05, 150, Easing.CubicOut);
            }

            // ???????? "??????" Hero Icon
            _ = HeroIcon.TranslateTo(0, -100, 500, Easing.CubicIn);
            _ = HeroIcon.FadeTo(0, 500, Easing.CubicIn);
            _ = HeroIcon.ScaleTo(1.5, 500, Easing.CubicIn);

            // ??????? fade out ???? ????????
            await MainCard.FadeTo(0, 400, Easing.CubicIn);

            // ?????????
            await Shell.Current.GoToAsync("//roleselection");

            button.IsEnabled = true;
        }
    }
}