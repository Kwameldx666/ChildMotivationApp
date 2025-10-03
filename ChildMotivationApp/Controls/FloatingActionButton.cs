using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Shapes;

namespace ChildMotivationApp.Controls;

public class FloatingActionButton : Border
{
    public FloatingActionButton()
    {
        WidthRequest = 70;
        HeightRequest = 70;
        StrokeThickness = 0;
        
        StrokeShape = new Ellipse();
        
        Background = new LinearGradientBrush
        {
            StartPoint = new Point(0, 0),
            EndPoint = new Point(1, 1),
            GradientStops = new GradientStopCollection
            {
                new GradientStop { Color = Color.FromArgb("#8B5CF6"), Offset = 0.0f },
                new GradientStop { Color = Color.FromArgb("#A78BFA"), Offset = 1.0f }
            }
        };
        
        Shadow = new Shadow
        {
            Brush = Color.FromArgb("#808B5CF6"),
            Radius = 20,
            Offset = new Point(0, 8)
        };
        
        Content = new Label
        {
            Text = "+",
            FontSize = 36,
            FontAttributes = FontAttributes.Bold,
            TextColor = Colors.White,
            HorizontalOptions = LayoutOptions.Center,
            VerticalOptions = LayoutOptions.Center
        };
        
        var tapGesture = new TapGestureRecognizer();
        tapGesture.Tapped += OnFabTapped;
        GestureRecognizers.Add(tapGesture);
    }
    
    private async void OnFabTapped(object? sender, EventArgs e)
    {
        // ???????? ???????
        await this.ScaleTo(0.9, 100);
        await this.ScaleTo(1.0, 100);
        
        // TODO: ??????? ?????? ???????? ??????
        if (Application.Current?.MainPage != null)
        {
            await Application.Current.MainPage.DisplayAlert(
                "??????? ??????", 
                "??????? ???????? ?????? ????? ????? ????????!", 
                "OK");
        }
    }
}