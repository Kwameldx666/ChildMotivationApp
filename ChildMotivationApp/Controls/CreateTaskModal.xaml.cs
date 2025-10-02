using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Shapes;

namespace ChildMotivationApp.Controls;

public partial class CreateTaskModal : ContentView
{
    private string _selectedVerificationMethod = "manual";

    public event EventHandler? TaskCreated;
    public event EventHandler? ModalClosed;

    public CreateTaskModal()
    {
        InitializeComponent();
        SetupInitialState();
    }

    private void SetupInitialState()
    {
        // Set default values exactly like in screenshot
        CategoryPicker.SelectedIndex = 0; // Cleaning
        PriorityPicker.SelectedIndex = 1; // Medium  
        AssignToPicker.SelectedIndex = 0; // Placeholder
        DueDatePicker.Date = new DateTime(2025, 10, 3); // 03.10.2025 as in screenshot
        PointsEntry.Text = "11";
        DifficultyEntry.Text = "4584984";
        TimeEntry.Text = "30";
        
        // Set manual verification as default (like in the screenshot)
        UpdateVerificationSelection("manual");
    }

    public async Task ShowAsync()
    {
        // Show modal
        ModalRoot.IsVisible = true;
        
        // Set initial animation state
        ModalFrame.Opacity = 0;
        ModalFrame.Scale = 0.8;
        ModalFrame.TranslationY = 100;

        // Animate entrance
        await Task.WhenAll(
            ModalFrame.FadeTo(1, 400, Easing.CubicOut),
            ModalFrame.ScaleTo(1.0, 400, Easing.CubicOut),
            ModalFrame.TranslateTo(0, 0, 400, Easing.CubicOut)
        );
    }

    public async Task HideAsync()
    {
        // Animate exit
        await Task.WhenAll(
            ModalFrame.FadeTo(0, 300, Easing.CubicIn),
            ModalFrame.ScaleTo(0.8, 300, Easing.CubicIn),
            ModalFrame.TranslateTo(0, 100, 300, Easing.CubicIn)
        );

        // Hide modal
        ModalRoot.IsVisible = false;
        
        // Reset form
        ResetForm();
        
        // Notify that modal was closed
        ModalClosed?.Invoke(this, EventArgs.Empty);
    }

    private void ResetForm()
    {
        TaskTitleEntry.Text = string.Empty;
        DescriptionEditor.Text = string.Empty;
        CategoryPicker.SelectedIndex = 0;
        PriorityPicker.SelectedIndex = 1;
        AssignToPicker.SelectedIndex = 0;
        PointsEntry.Text = "11";
        DifficultyEntry.Text = "4584984";
        TimeEntry.Text = "30";
        DueDatePicker.Date = new DateTime(2025, 10, 3);
        UpdateVerificationSelection("manual");
    }

    private async void OnCloseClicked(object sender, EventArgs e)
    {
        await HideAsync();
    }

    private async void OnCancelClicked(object sender, EventArgs e)
    {
        await HideAsync();
    }

    private async void OnCreateTaskClicked(object sender, EventArgs e)
    {
        // Validate required fields
        if (string.IsNullOrWhiteSpace(TaskTitleEntry.Text))
        {
            await Application.Current?.MainPage?.DisplayAlert("Error", "Please enter a task title", "OK")!;
            return;
        }

        if (AssignToPicker.SelectedIndex <= 0)
        {
            await Application.Current?.MainPage?.DisplayAlert("Error", "Please select who to assign this task to", "OK")!;
            return;
        }

        // Validate numeric fields
        if (!int.TryParse(PointsEntry.Text, out int points) || points < 1)
        {
            await Application.Current?.MainPage?.DisplayAlert("Error", "Please enter valid points (minimum 1)", "OK")!;
            return;
        }

        if (!int.TryParse(DifficultyEntry.Text, out int difficulty) || difficulty < 1)
        {
            await Application.Current?.MainPage?.DisplayAlert("Error", "Please enter valid difficulty", "OK")!;
            return;
        }

        if (!int.TryParse(TimeEntry.Text, out int timeMinutes) || timeMinutes < 1)
        {
            await Application.Current?.MainPage?.DisplayAlert("Error", "Please enter valid time in minutes", "OK")!;
            return;
        }

        // Animate button click
        await AnimateButtonClick();

        // Create task object (in real app, save to database)
        var task = new
        {
            Title = TaskTitleEntry.Text.Trim(),
            Description = DescriptionEditor.Text?.Trim() ?? "",
            Category = CategoryPicker.SelectedItem?.ToString() ?? "",
            Priority = PriorityPicker.SelectedItem?.ToString() ?? "",
            Points = points,
            Difficulty = difficulty,
            EstimatedTime = timeMinutes,
            DueDate = DueDatePicker.Date,
            AssignedTo = AssignToPicker.SelectedItem?.ToString() ?? "",
            VerificationMethod = _selectedVerificationMethod,
            CreatedAt = DateTime.Now,
            Status = "Pending"
        };

        // Show success message
        await Application.Current?.MainPage?.DisplayAlert("Success! ??", 
            $"Task '{task.Title}' has been created successfully!", 
            "Great!")!;

        // Notify parent that task was created
        TaskCreated?.Invoke(this, EventArgs.Empty);

        // Close modal
        await HideAsync();
    }

    private async Task AnimateButtonClick()
    {
        await CreateTaskButton.ScaleTo(0.95, 100, Easing.CubicOut);
        await CreateTaskButton.ScaleTo(1.0, 100, Easing.CubicOut);
    }

    // Verification method selection handlers
    private async void OnPhotoVerificationTapped(object sender, EventArgs e)
    {
        await AnimateVerificationSelection("photo");
        UpdateVerificationSelection("photo");
    }

    private async void OnVideoVerificationTapped(object sender, EventArgs e)
    {
        await AnimateVerificationSelection("video");
        UpdateVerificationSelection("video");
    }

    private async void OnChecklistVerificationTapped(object sender, EventArgs e)
    {
        await AnimateVerificationSelection("checklist");
        UpdateVerificationSelection("checklist");
    }

    private async void OnManualVerificationTapped(object sender, EventArgs e)
    {
        await AnimateVerificationSelection("manual");
        UpdateVerificationSelection("manual");
    }

    private async Task AnimateVerificationSelection(string method)
    {
        Border targetBorder = method switch
        {
            "photo" => PhotoVerificationBorder,
            "video" => VideoVerificationBorder,
            "checklist" => ChecklistVerificationBorder,
            "manual" => ManualVerificationBorder,
            _ => ManualVerificationBorder
        };

        // Animate selection
        await targetBorder.ScaleTo(0.95, 100, Easing.CubicOut);
        await targetBorder.ScaleTo(1.0, 100, Easing.CubicOut);
    }

    private void UpdateVerificationSelection(string method)
    {
        _selectedVerificationMethod = method;

        // Reset all borders and radio buttons
        ResetVerificationBorder(PhotoVerificationBorder);
        ResetVerificationBorder(VideoVerificationBorder);
        ResetVerificationBorder(ChecklistVerificationBorder);
        ResetVerificationBorder(ManualVerificationBorder);

        // Highlight selected method
        Border selectedBorder = method switch
        {
            "photo" => PhotoVerificationBorder,
            "video" => VideoVerificationBorder,
            "checklist" => ChecklistVerificationBorder,
            "manual" => ManualVerificationBorder,
            _ => ManualVerificationBorder
        };

        // Apply selected styling
        selectedBorder.BackgroundColor = Color.FromArgb("#F3E8FF");
        selectedBorder.Stroke = Color.FromArgb("#8B5CF6");
        selectedBorder.StrokeThickness = 2;

        // Update radio button
        UpdateRadioButton(selectedBorder, true);
    }

    private void ResetVerificationBorder(Border border)
    {
        border.BackgroundColor = Color.FromArgb("#FFFFFF");
        border.Stroke = Color.FromArgb("#E5E7EB");
        border.StrokeThickness = 1;
        UpdateRadioButton(border, false);
    }

    private void UpdateRadioButton(Border border, bool isSelected)
    {
        if (border.Content is HorizontalStackLayout hsl && 
            hsl.Children.FirstOrDefault() is Border radioButton)
        {
            if (isSelected)
            {
                // Selected state - purple with white dot
                radioButton.BackgroundColor = Color.FromArgb("#8B5CF6");
                radioButton.Stroke = Color.FromArgb("#8B5CF6");
                
                // Add white dot if it doesn't exist
                if (radioButton.Content == null)
                {
                    var dot = new Border
                    {
                        WidthRequest = 8,
                        HeightRequest = 8,
                        BackgroundColor = Color.FromArgb("#FFFFFF"),
                        StrokeShape = new Ellipse(),
                        HorizontalOptions = LayoutOptions.Center,
                        VerticalOptions = LayoutOptions.Center
                    };
                    radioButton.Content = dot;
                }
            }
            else
            {
                // Unselected state - change to icon for other verification methods
                if (border == PhotoVerificationBorder)
                {
                    // Reset to photo icon
                    radioButton.BackgroundColor = Color.FromArgb("#F3F4F6");
                    radioButton.Stroke = Color.FromArgb("#F3F4F6");
                    radioButton.StrokeShape = new RoundRectangle { CornerRadius = 4 };
                    radioButton.Content = new Label
                    {
                        Text = "??",
                        FontSize = 14,
                        HorizontalOptions = LayoutOptions.Center,
                        VerticalOptions = LayoutOptions.Center
                    };
                }
                else if (border == VideoVerificationBorder)
                {
                    // Reset to video icon
                    radioButton.BackgroundColor = Color.FromArgb("#F3F4F6");
                    radioButton.Stroke = Color.FromArgb("#F3F4F6");
                    radioButton.StrokeShape = new RoundRectangle { CornerRadius = 4 };
                    radioButton.Content = new Label
                    {
                        Text = "??",
                        FontSize = 14,
                        HorizontalOptions = LayoutOptions.Center,
                        VerticalOptions = LayoutOptions.Center
                    };
                }
                else if (border == ChecklistVerificationBorder)
                {
                    // Reset to checklist icon
                    radioButton.BackgroundColor = Color.FromArgb("#F3F4F6");
                    radioButton.Stroke = Color.FromArgb("#F3F4F6");
                    radioButton.StrokeShape = new RoundRectangle { CornerRadius = 4 };
                    radioButton.Content = new Label
                    {
                        Text = "??",
                        FontSize = 14,
                        HorizontalOptions = LayoutOptions.Center,
                        VerticalOptions = LayoutOptions.Center
                    };
                }
                else
                {
                    // Unselected manual check - gray circle border only
                    radioButton.BackgroundColor = Color.FromArgb("#FFFFFF");
                    radioButton.Stroke = Color.FromArgb("#E5E7EB");
                    radioButton.StrokeShape = new Ellipse();
                    radioButton.Content = null;
                }
            }
        }
    }

    private void UpdateVerificationIcons(string selectedMethod)
    {
        // This method is no longer needed with the new design
        // The radio buttons handle the visual indication
    }
}