using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class WelcomePage : ContentPage
{
    public WelcomePage()
        : this(ServiceHelper.GetRequiredService<WelcomePageViewModel>())
    {
    }

    public WelcomePage(WelcomePageViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}