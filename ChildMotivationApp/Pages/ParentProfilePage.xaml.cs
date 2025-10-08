using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class ParentProfilePage : ContentPage
{
    private readonly ParentProfilePageViewModel _viewModel;

    public ParentProfilePage()
        : this(ServiceHelper.GetRequiredService<ParentProfilePageViewModel>())
    {
    }

    public ParentProfilePage(ParentProfilePageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.OnAppearingAsync();
    }
}
