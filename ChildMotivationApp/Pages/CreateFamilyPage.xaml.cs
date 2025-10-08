using System.Collections.Generic;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class CreateFamilyPage : ContentPage, IQueryAttributable
{
    private readonly CreateFamilyPageViewModel _viewModel;

    public CreateFamilyPage()
        : this(ServiceHelper.GetRequiredService<CreateFamilyPageViewModel>())
    {
    }

    public CreateFamilyPage(CreateFamilyPageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("parentName", out var value) && value is string parentName)
        {
            _viewModel.ParentName = parentName;
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
