using System;
using System.Globalization;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;

namespace ChildMotivationApp.Converters;

public sealed class BoolToColorConverter : IValueConverter
{
    public Color TrueColor { get; set; } = Colors.Transparent;

    public Color FalseColor { get; set; } = Colors.Transparent;

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool flag)
        {
            return flag ? TrueColor : FalseColor;
        }

        return FalseColor;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
