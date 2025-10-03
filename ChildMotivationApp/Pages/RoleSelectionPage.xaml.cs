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

    // HOVER ??????? - ????????
    private void OnParentRoleHoverEntered(object sender, PointerEventArgs e)
    {
        ParentRole.Stroke = Color.FromArgb("#3B82F6");
        ParentRole.StrokeThickness = 3;
        ParentRole.Scale = 1.02;
    }

    private void OnParentRoleHoverExited(object sender, PointerEventArgs e)
    {
        ParentRole.Stroke = Color.FromArgb("#E5E7EB");
        ParentRole.StrokeThickness = 2;
        ParentRole.Scale = 1.0;
    }

    // HOVER ??????? - ???????
    private void OnChildRoleHoverEntered(object sender, PointerEventArgs e)
    {
        ChildRole.Stroke = Color.FromArgb("#D946EF");
        ChildRole.StrokeThickness = 3;
        ChildRole.Scale = 1.02;
    }

    private void OnChildRoleHoverExited(object sender, PointerEventArgs e)
    {
        ChildRole.Stroke = Color.FromArgb("#E5E7EB");
        ChildRole.StrokeThickness = 2;
        ChildRole.Scale = 1.0;
    }

    // ???? - ????????
    private async void OnParentRoleSelected(object sender, EventArgs e)
    {
        // ???????? ??? ?????
        await ParentRole.ScaleTo(0.95, 100, Easing.CubicOut);
        await ParentRole.ScaleTo(1.02, 100, Easing.CubicOut);
        
        await Task.Delay(150);
        await Shell.Current.GoToAsync($"//profilesetup?role=Parent");
    }

    // ???? - ???????
    private async void OnChildRoleSelected(object sender, EventArgs e)
    {
        // ???????? ??? ?????
        await ChildRole.ScaleTo(0.95, 100, Easing.CubicOut);
        await ChildRole.ScaleTo(1.02, 100, Easing.CubicOut);
        
        await Task.Delay(150);
        await Shell.Current.GoToAsync($"//profilesetup?role=Child");
    }
}