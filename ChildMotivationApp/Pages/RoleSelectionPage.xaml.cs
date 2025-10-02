using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class RoleSelectionPage : ContentPage
{
    private Border? _selectedRole = null;
    private string _selectedRoleType = string.Empty;
    private Dictionary<Border, string> _borderToRoleType = new Dictionary<Border, string>();

    public RoleSelectionPage()
    {
        InitializeComponent();
        SetupRoleSelection();
        StartEntranceAnimations();
    }

    private void SetupRoleSelection()
    {
        var parentRole = this.FindByName<Border>("ParentRole");
        var childRole = this.FindByName<Border>("ChildRole");

        if (parentRole != null)
        {
            _borderToRoleType[parentRole] = "Parent";
            AddRoleSelectionGestures(parentRole, "Parent");
        }

        if (childRole != null)
        {
            _borderToRoleType[childRole] = "Child";
            AddRoleSelectionGestures(childRole, "Child");
        }
    }

    private void AddRoleSelectionGestures(Border? roleBorder, string roleType)
    {
        if (roleBorder != null)
        {
            var tapGesture = new TapGestureRecognizer();
            tapGesture.Tapped += (sender, e) => OnRoleSelected(roleBorder, roleType);
            roleBorder.GestureRecognizers.Add(tapGesture);

            #if WINDOWS || MACCATALYST
            var pointerGesture = new PointerGestureRecognizer();
            pointerGesture.PointerEntered += (sender, e) => OnRolePointerEntered(roleBorder);
            pointerGesture.PointerExited += (sender, e) => OnRolePointerExited(roleBorder);
            roleBorder.GestureRecognizers.Add(pointerGesture);
            #endif
        }
    }

    private async void OnRoleSelected(Border selectedBorder, string roleType)
    {
        // Start deselection and selection animations simultaneously
        var tasks = new List<Task>();
        
        if (_selectedRole != null && _selectedRole != selectedBorder)
        {
            tasks.Add(AnimateDeselection(_selectedRole));
        }

        _selectedRole = selectedBorder;
        _selectedRoleType = roleType;
        tasks.Add(AnimateSelection(selectedBorder));

        // Wait for all animations to complete
        await Task.WhenAll(tasks);

        // Navigate immediately after animation
        await NavigateBasedOnRole(roleType);
    }

    private async Task NavigateBasedOnRole(string roleType)
    {
        await DisplayAlert("Role Selected", $"Welcome, {roleType}!", "Continue");
        await Shell.Current.GoToAsync("//welcome");
    }

    private async Task AnimateSelection(Border border)
    {
        var scaleTask = border.ScaleTo(1.06, 350, Easing.CubicOut);
        var shadowTask = AnimateSelectionGlow(border, true);
        await Task.WhenAll(scaleTask, shadowTask);
        await border.ScaleTo(1.03, 200, Easing.CubicOut);
    }

    private async Task AnimateDeselection(Border border)
    {
        var scaleTask = border.ScaleTo(1.0, 300, Easing.CubicOut);
        var shadowTask = AnimateSelectionGlow(border, false);
        await Task.WhenAll(scaleTask, shadowTask);
    }

    private async Task AnimateSelectionGlow(Border border, bool selected)
    {
        if (selected)
        {
            border.Stroke = Color.FromArgb("#6366F1");
            border.StrokeThickness = 2.5;
            border.Shadow = new Shadow
            {
                Brush = Color.FromArgb("#406366F1"),
                Radius = 32,
                Offset = new Point(0, 16)
            };
        }
        else
        {
            border.Stroke = Color.FromArgb("#E5E7EB");
            border.StrokeThickness = 1.5;
            border.Shadow = new Shadow
            {
                Brush = Color.FromArgb("#20000000"),
                Radius = 28,
                Offset = new Point(0, 14)
            };
        }
        await Task.CompletedTask;
    }

    #if WINDOWS || MACCATALYST
    private void OnRolePointerEntered(Border roleBorder)
    {
        if (roleBorder != _selectedRole)
        {
            // Start scale animation without awaiting
            roleBorder.ScaleTo(1.04, 200, Easing.CubicOut);

            // Immediately start border color animation
            var animation = new Animation(v => {
                var startColor = Color.FromArgb("#E5E7EB"); // Initial color
                var endColor = Color.FromArgb("#8B5CF6");   // Hover color
                var interpolatedColor = Color.FromRgba(
                    startColor.Red + v * (endColor.Red - startColor.Red),
                    startColor.Green + v * (endColor.Green - startColor.Green),
                    startColor.Blue + v * (endColor.Blue - startColor.Blue),
                    startColor.Alpha + v * (endColor.Alpha - startColor.Alpha)
                );
                roleBorder.Stroke = new SolidColorBrush(interpolatedColor);
            });
            animation.Commit(roleBorder, "BorderHoverAnimation", 16, 200, Easing.CubicOut);
        }
    }

    private void OnRolePointerExited(Border roleBorder)
    {
        if (roleBorder != _selectedRole)
        {
            // Start scale animation without awaiting
            roleBorder.ScaleTo(1.0, 200, Easing.CubicOut);

            // Immediately start border color animation
            var animation = new Animation(v => {
                var startColor = Color.FromArgb("#8B5CF6"); // Hover color
                var endColor = Color.FromArgb("#E5E7EB");   // Initial color
                var interpolatedColor = Color.FromRgba(
                    startColor.Red + v * (endColor.Red - startColor.Red),
                    startColor.Green + v * (endColor.Green - startColor.Green),
                    startColor.Blue + v * (endColor.Blue - startColor.Blue),
                    startColor.Alpha + v * (endColor.Alpha - startColor.Alpha)
                );
                roleBorder.Stroke = new SolidColorBrush(interpolatedColor);
            });
            animation.Commit(roleBorder, "BorderExitAnimation", 16, 200, Easing.CubicOut);
        }
    }
    #endif

    private async void StartEntranceAnimations()
    {
        await Task.Delay(150);

        var mainCard = this.FindByName<Frame>("MainCard");
        var titleLabel = this.FindByName<Label>("PageTitleLabel");
        var rolesGrid = this.FindByName<Grid>("RolesGrid");

        if (mainCard != null)
        {
            mainCard.Opacity = 0;
            mainCard.TranslationY = 50;
            mainCard.Scale = 0.9;
        }

        var elements = new List<(VisualElement element, int delay)>
        {
            (titleLabel, 250),
            (rolesGrid, 450)
        };

        foreach (var (element, _) in elements)
        {
            if (element != null)
            {
                element.Opacity = 0;
                element.TranslationY = 25;
                element.Scale = 0.9;
            }
        }

        if (mainCard != null)
        {
            var fadeTask = mainCard.FadeTo(1, 900, Easing.CubicOut);
            var translateTask = mainCard.TranslateTo(0, 0, 900, Easing.CubicOut);
            var scaleTask = mainCard.ScaleTo(1.0, 900, Easing.CubicOut);
            await Task.WhenAll(fadeTask, translateTask, scaleTask);
        }

        var animationTasks = elements
            .Where(x => x.element != null)
            .Select(x => AnimateElementEntrance(x.element, x.delay))
            .ToArray();

        await Task.WhenAll(animationTasks);
    }

    private async Task AnimateElementEntrance(VisualElement element, int delay)
    {
        await Task.Delay(delay);
        
        var fadeTask = element.FadeTo(1, 700, Easing.CubicOut);
        var translateTask = element.TranslateTo(0, 0, 700, Easing.CubicOut);
        var scaleTask = element.ScaleTo(1.0, 700, Easing.CubicOut);
        
        await Task.WhenAll(fadeTask, translateTask, scaleTask);
    }
}