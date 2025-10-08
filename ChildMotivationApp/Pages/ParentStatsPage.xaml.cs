using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class ParentStatsPage : ContentPage
{
    private readonly ParentStatsPageViewModel _viewModel;

    public ParentStatsPage()
        : this(ServiceHelper.GetRequiredService<ParentStatsPageViewModel>())
    {
    }

    public ParentStatsPage(ParentStatsPageViewModel viewModel)
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
