using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Helpers;

public static class DeviceHelper
{
    public static ResponsiveDeviceType GetDeviceType()
    {
        var mainDisplayInfo = DeviceDisplay.MainDisplayInfo;
        var width = mainDisplayInfo.Width / mainDisplayInfo.Density;
        var height = mainDisplayInfo.Height / mainDisplayInfo.Density;
        
        // Determine device type based on screen size
        if (width < 600)
        {
            return ResponsiveDeviceType.Mobile;
        }
        else if (width < 1200)
        {
            return ResponsiveDeviceType.Tablet;
        }
        else
        {
            return ResponsiveDeviceType.Desktop;
        }
    }
    
    public static bool IsMobile => GetDeviceType() == ResponsiveDeviceType.Mobile;
    public static bool IsTablet => GetDeviceType() == ResponsiveDeviceType.Tablet;
    public static bool IsDesktop => GetDeviceType() == ResponsiveDeviceType.Desktop;
    
    public static double GetResponsiveFontSize(double mobile, double tablet, double desktop)
    {
        return GetDeviceType() switch
        {
            ResponsiveDeviceType.Mobile => mobile,
            ResponsiveDeviceType.Tablet => tablet,
            ResponsiveDeviceType.Desktop => desktop,
            _ => mobile
        };
    }
    
    public static Thickness GetResponsivePadding(Thickness mobile, Thickness tablet, Thickness desktop)
    {
        return GetDeviceType() switch
        {
            ResponsiveDeviceType.Mobile => mobile,
            ResponsiveDeviceType.Tablet => tablet,
            ResponsiveDeviceType.Desktop => desktop,
            _ => mobile
        };
    }
}

public enum ResponsiveDeviceType
{
    Mobile,
    Tablet,
    Desktop
}