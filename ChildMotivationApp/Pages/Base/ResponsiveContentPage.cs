using ChildMotivationApp.Helpers;

namespace ChildMotivationApp.Pages.Base;

public abstract partial class ResponsiveContentPage : ContentPage
{
    protected ResponsiveDeviceType CurrentDeviceType { get; private set; }
    private bool _isInitialized = false;
    
    public ResponsiveContentPage()
    {
        CurrentDeviceType = DeviceHelper.GetDeviceType();
        // ?? ???????? ApplyResponsiveStyles() ? ????????????
    }
    
    protected override void OnSizeAllocated(double width, double height)
    {
        base.OnSizeAllocated(width, height);
        
        var newDeviceType = DeviceHelper.GetDeviceType();
        if (newDeviceType != CurrentDeviceType)
        {
            CurrentDeviceType = newDeviceType;
            // ?????? ????????? ????? ???? ???????? ????????????????
            if (_isInitialized)
            {
                try
                {
                    ApplyResponsiveStyles();
                }
                catch
                {
                    // ?????????? ?????? ?????? ??? ????????????
                }
            }
        }
    }
    
    protected abstract void ApplyResponsiveStyles();
    
    /// <summary>
    /// ????????? ???? ????? ????? InitializeComponent() ? ??????????? ???????
    /// </summary>
    protected void InitializeResponsiveStyles()
    {
        try
        {
            _isInitialized = true;
            ApplyResponsiveStyles();
        }
        catch
        {
            // ?????????? ?????? ?????? ??? ????????????
        }
    }
    
    protected double GetResponsiveFontSize(double mobile, double tablet, double desktop)
    {
        return DeviceHelper.GetResponsiveFontSize(mobile, tablet, desktop);
    }
    
    protected Thickness GetResponsivePadding(Thickness mobile, Thickness tablet, Thickness desktop)
    {
        return DeviceHelper.GetResponsivePadding(mobile, tablet, desktop);
    }
    
    protected GridLength GetResponsiveGridLength(double mobile, double tablet, double desktop)
    {
        return CurrentDeviceType switch
        {
            ResponsiveDeviceType.Mobile => new GridLength(mobile, GridUnitType.Star),
            ResponsiveDeviceType.Tablet => new GridLength(tablet, GridUnitType.Star),
            ResponsiveDeviceType.Desktop => new GridLength(desktop, GridUnitType.Star),
            _ => new GridLength(mobile, GridUnitType.Star)
        };
    }
    
    protected int GetResponsiveColumns()
    {
        return CurrentDeviceType switch
        {
            ResponsiveDeviceType.Mobile => 1,
            ResponsiveDeviceType.Tablet => 2,
            ResponsiveDeviceType.Desktop => 4,
            _ => 1
        };
    }
}