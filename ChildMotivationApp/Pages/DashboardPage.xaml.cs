using System.Collections.Generic;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class DashboardPage : ContentPage, IQueryAttributable
{
    private readonly DashboardPageViewModel _viewModel;

    public DashboardPage()
        : this(ServiceHelper.GetRequiredService<DashboardPageViewModel>())
    {
    }

    public DashboardPage(DashboardPageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("parentName", out var parent) && parent is string parentName)
        {
            _viewModel.ParentName = parentName;
        }

        if (query.TryGetValue("familyName", out var family) && family is string familyName)
        {
            _viewModel.FamilyName = familyName;
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