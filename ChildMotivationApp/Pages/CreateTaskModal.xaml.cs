using Microsoft.Maui.Controls;
using System;

namespace ChildMotivationApp.Pages;

public partial class CreateTaskModal : ContentPage
{
    private string _selectedVerificationMethod = "photo";

    public CreateTaskModal()
    {
        InitializeComponent();
        
        // ????????????? ???? ?? ????????? (??????)
        DueDatePicker.Date = DateTime.Now.AddDays(1);
        
        // ????????????? ???????? ?? ?????????
        CategoryPicker.SelectedIndex = 0;
        PriorityPicker.SelectedIndex = 1;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        
        // ???????? ?????????
        _ = AnimateModalAppearance();
    }

    private async System.Threading.Tasks.Task AnimateModalAppearance()
    {
        var content = (Grid)Content;
        var modal = (Border)content.Children[0];
        
        modal.Scale = 0.8;
        modal.Opacity = 0;

        await System.Threading.Tasks.Task.WhenAll(
            modal.ScaleTo(1, 300, Easing.SpringOut),
            modal.FadeTo(1, 300)
        );
    }

    private async void OnCloseTapped(object sender, TappedEventArgs e)
    {
        await AnimateButton(CloseButton);
        await CloseModal();
    }

    private async void OnCancelClicked(object sender, EventArgs e)
    {
        await CloseModal();
    }

    private async System.Threading.Tasks.Task CloseModal()
    {
        var content = (Grid)Content;
        var modal = (Border)content.Children[0];

        await System.Threading.Tasks.Task.WhenAll(
            modal.ScaleTo(0.8, 200, Easing.CubicIn),
            modal.FadeTo(0, 200)
        );

        await Navigation.PopModalAsync();
    }

    private async void OnCreateTaskClicked(object sender, EventArgs e)
    {
        // ?????????
        if (string.IsNullOrWhiteSpace(TaskNameEntry.Text))
        {
            await DisplayAlert("??????", "??????????, ??????? ???????? ??????", "OK");
            return;
        }

        if (ChildPicker.SelectedIndex < 0)
        {
            ChildSelectionError.IsVisible = true;
            await DisplayAlert("??????", "??????????, ???????? ???????", "OK");
            return;
        }

        // ???????? ??????
        await CreateButton.ScaleTo(0.95, 100);
        await CreateButton.ScaleTo(1, 100);

        // ??????? ??????
        var taskData = new
        {
            Name = TaskNameEntry.Text,
            Description = DescriptionEditor.Text,
            Category = CategoryPicker.SelectedItem?.ToString(),
            Priority = PriorityPicker.SelectedItem?.ToString(),
            Points = int.TryParse(PointsEntry.Text, out int points) ? points : 10,
            Difficulty = int.TryParse(DifficultyEntry.Text, out int diff) ? diff : 3,
            Duration = int.TryParse(DurationEntry.Text, out int dur) ? dur : 30,
            DueDate = DueDatePicker.Date,
            AssignedChild = ChildPicker.SelectedItem?.ToString(),
            VerificationMethod = _selectedVerificationMethod
        };

        await DisplayAlert(
            "?????? ???????! ??", 
            $"?????? '{taskData.Name}' ??????? ?????????!\n\n" +
            $"?????????: {taskData.Category}\n" +
            $"????: {taskData.Points}\n" +
            $"????: {taskData.DueDate:dd.MM.yyyy}", 
            "???????!");

        await CloseModal();
    }

    // Verification Method Selection
    private async void OnPhotoVerificationTapped(object sender, TappedEventArgs e)
    {
        _selectedVerificationMethod = "photo";
        await UpdateVerificationSelection(PhotoVerificationBorder);
    }

    private async void OnVideoVerificationTapped(object sender, TappedEventArgs e)
    {
        _selectedVerificationMethod = "video";
        await UpdateVerificationSelection(VideoVerificationBorder);
    }

    private async void OnChecklistVerificationTapped(object sender, TappedEventArgs e)
    {
        _selectedVerificationMethod = "checklist";
        await UpdateVerificationSelection(ChecklistVerificationBorder);
    }

    private async void OnManualVerificationTapped(object sender, TappedEventArgs e)
    {
        _selectedVerificationMethod = "manual";
        await UpdateVerificationSelection(ManualVerificationBorder);
    }

    private async System.Threading.Tasks.Task UpdateVerificationSelection(Border selectedBorder)
    {
        // ????????
        await selectedBorder.ScaleTo(0.95, 100);
        await selectedBorder.ScaleTo(1, 100, Easing.SpringOut);

        // ????? ???? ??????
        PhotoVerificationBorder.BackgroundColor = Color.FromArgb("#F9FAFB");
        PhotoVerificationBorder.Stroke = Color.FromArgb("#E5E7EB");
        PhotoVerificationBorder.StrokeThickness = 1;

        VideoVerificationBorder.BackgroundColor = Color.FromArgb("#F9FAFB");
        VideoVerificationBorder.Stroke = Color.FromArgb("#E5E7EB");
        VideoVerificationBorder.StrokeThickness = 1;

        ChecklistVerificationBorder.BackgroundColor = Color.FromArgb("#F9FAFB");
        ChecklistVerificationBorder.Stroke = Color.FromArgb("#E5E7EB");
        ChecklistVerificationBorder.StrokeThickness = 1;

        ManualVerificationBorder.BackgroundColor = Color.FromArgb("#F9FAFB");
        ManualVerificationBorder.Stroke = Color.FromArgb("#E5E7EB");
        ManualVerificationBorder.StrokeThickness = 1;

        // ???????? ?????????
        selectedBorder.BackgroundColor = Color.FromArgb("#F5F3FF");
        selectedBorder.Stroke = Color.FromArgb("#8B5CF6");
        selectedBorder.StrokeThickness = 2;
    }

    private async System.Threading.Tasks.Task AnimateButton(View button)
    {
        await button.ScaleTo(0.9, 100);
        await button.ScaleTo(1, 100, Easing.SpringOut);
    }
}