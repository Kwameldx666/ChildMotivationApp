using System;
using System.Threading.Tasks;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.ViewModels;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class CreateTaskModal : ContentPage
{
    private readonly CreateTaskModalViewModel _viewModel;
    private bool _isSubscribed;
    private bool _isClosing;

    public CreateTaskModal()
        : this(ServiceHelper.GetRequiredService<CreateTaskModalViewModel>())
    {
    }

    public CreateTaskModal(CreateTaskModalViewModel viewModel)
    {
        InitializeComponent();

        _viewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));
        BindingContext = _viewModel;
        SubscribeToViewModel();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();

        _isClosing = false;
        SubscribeToViewModel();
        _ = AnimateInAsync();
    }

    protected override void OnDisappearing()
    {
        UnsubscribeFromViewModel();

        base.OnDisappearing();
    }

    private void OnRequestClose(object? sender, EventArgs e)
    {
        _ = MainThread.InvokeOnMainThreadAsync(CloseAsync);
    }

    private void SubscribeToViewModel()
    {
        if (_isSubscribed)
        {
            return;
        }

        _viewModel.RequestClose += OnRequestClose;
        _isSubscribed = true;
    }

    private void UnsubscribeFromViewModel()
    {
        if (!_isSubscribed)
        {
            return;
        }

        _viewModel.RequestClose -= OnRequestClose;
        _isSubscribed = false;
    }

    private async Task CloseAsync()
    {
        if (_isClosing)
        {
            return;
        }

        _isClosing = true;

        await AnimateOutAsync();

        if (Navigation?.ModalStack.Contains(this) == true)
        {
            await Navigation.PopModalAsync();
        }
    }

    private Task AnimateInAsync()
    {
        if (ModalContainer is null)
        {
            return Task.CompletedTask;
        }

        ModalContainer.Scale = 0.9;
        ModalContainer.Opacity = 0;

        return Task.WhenAll(
            ModalContainer.ScaleTo(1, 300, Easing.SpringOut),
            ModalContainer.FadeTo(1, 300));
    }

    private Task AnimateOutAsync()
    {
        if (ModalContainer is null)
        {
            return Task.CompletedTask;
        }

        return Task.WhenAll(
            ModalContainer.ScaleTo(0.9, 200, Easing.CubicIn),
            ModalContainer.FadeTo(0, 200));
    }
}