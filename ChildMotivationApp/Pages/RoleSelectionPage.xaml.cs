using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class RoleSelectionPage : ContentPage
{
    public RoleSelectionPage()
        : this(ServiceHelper.GetRequiredService<RoleSelectionPageViewModel>())
    {
    }

    public RoleSelectionPage(RoleSelectionPageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}