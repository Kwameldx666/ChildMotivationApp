using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class RewardsShopPage : ContentPage
{
    private readonly RewardsShopPageViewModel _viewModel;

    public RewardsShopPage()
        : this(ServiceHelper.GetRequiredService<RewardsShopPageViewModel>())
    {
    }

    public RewardsShopPage(RewardsShopPageViewModel viewModel)
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