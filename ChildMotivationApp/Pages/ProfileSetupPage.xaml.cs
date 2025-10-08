using System.Collections.Generic;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class ProfileSetupPage : ContentPage, IQueryAttributable
{
    private readonly ProfileSetupPageViewModel _viewModel;

    public ProfileSetupPage()
        : this(ServiceHelper.GetRequiredService<ProfileSetupPageViewModel>())
    {
    }

    public ProfileSetupPage(ProfileSetupPageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("role", out var roleValue) && roleValue is string role)
        {
            _viewModel.Role = role;
        }
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _ = _viewModel.OnAppearingAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _ = _viewModel.OnDisappearingAsync();
    }
}