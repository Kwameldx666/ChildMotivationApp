using ChildMotivationApp.Pages.Base;
using ChildMotivationApp.Helpers;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class RoleSelectionPage : ContentPage
{
    public RoleSelectionPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        StartEntranceAnimations();
    }

    private async void StartEntranceAnimations()
    {
        // ????????? ?????????
        var headerSection = this.FindByName<VerticalStackLayout>("HeaderSection");
        
        if (headerSection != null)
        {
            headerSection.Opacity = 0;
            headerSection.TranslationY = -20;
        }

        if (ParentRole != null)
        {
            ParentRole.Opacity = 0;
            ParentRole.Scale = 0.8;
            ParentRole.TranslationX = -30;
        }

        if (ChildRole != null)
        {
            ChildRole.Opacity = 0;
            ChildRole.Scale = 0.8;
            ChildRole.TranslationX = 30;
        }

        await Task.Delay(100);

        // ????????? ?????????
        if (headerSection != null)
        {
            await Task.WhenAll(
                headerSection.FadeTo(1, 500, Easing.CubicOut),
                headerSection.TranslateTo(0, 0, 500, Easing.CubicOut)
            );
        }

        // ????????? Parent ???????? ?????
        await Task.Delay(100);
        if (ParentRole != null)
        {
            await Task.WhenAll(
                ParentRole.FadeTo(1, 600, Easing.CubicOut),
                ParentRole.ScaleTo(1, 700, Easing.SpringOut),
                ParentRole.TranslateTo(0, 0, 600, Easing.CubicOut)
            );
        }

        // ????????? Child ???????? ??????
        await Task.Delay(150);
        if (ChildRole != null)
        {
            await Task.WhenAll(
                ChildRole.FadeTo(1, 600, Easing.CubicOut),
                ChildRole.ScaleTo(1, 700, Easing.SpringOut),
                ChildRole.TranslateTo(0, 0, 600, Easing.CubicOut)
            );
        }

        // ????????? ????????? ?????????
        _ = PulseCards();
    }

    private async Task PulseCards()
    {
        await Task.Delay(400);
        
        // ?????????? ??? ???????? ?? ???????
        for (int i = 0; i < 2; i++)
        {
            if (ParentRole != null)
            {
                _ = Task.Run(async () =>
                {
                    await MainThread.InvokeOnMainThreadAsync(async () =>
                    {
                        await ParentRole.ScaleTo(1.03, 600, Easing.SinInOut);
                        await ParentRole.ScaleTo(1.0, 600, Easing.SinInOut);
                    });
                });
            }

            await Task.Delay(100);

            if (ChildRole != null)
            {
                await ChildRole.ScaleTo(1.03, 600, Easing.SinInOut);
                await ChildRole.ScaleTo(1.0, 600, Easing.SinInOut);
            }

            await Task.Delay(200);
        }
    }

    private async void OnParentRoleSelected(object sender, EventArgs e)
    {
        // ???????? ???????? ??????
        if (sender is Border border)
        {
            // ??????????? ????????? ????????
            await border.ScaleTo(0.95, 80, Easing.CubicIn);
            
            // ?????? ???? ??????? ?? ????????
            border.Stroke = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 1),
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#10B981"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#34D399"), Offset = 1 }
                }
            };
            
            await border.ScaleTo(1.05, 150, Easing.SpringOut);
            
            // ????????? ?????? ????????
            if (ChildRole != null)
            {
                _ = ChildRole.FadeTo(0.5, 200);
            }

            await Task.Delay(200);
        }

        // Navigate
        await Shell.Current.GoToAsync($"//profilesetup?role=Parent");
    }

    private async void OnChildRoleSelected(object sender, EventArgs e)
    {
        // ???????? ???????? ??????
        if (sender is Border border)
        {
            await border.ScaleTo(0.95, 80, Easing.CubicIn);
            
            border.Stroke = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 1),
                GradientStops = new GradientStopCollection
                {
                    new GradientStop { Color = Color.FromArgb("#EC4899"), Offset = 0 },
                    new GradientStop { Color = Color.FromArgb("#F472B6"), Offset = 1 }
                }
            };
            
            await border.ScaleTo(1.05, 150, Easing.SpringOut);
            
            if (ParentRole != null)
            {
                _ = ParentRole.FadeTo(0.5, 200);
            }

            await Task.Delay(200);
        }

        await Shell.Current.GoToAsync($"//profilesetup?role=Child");
    }
}