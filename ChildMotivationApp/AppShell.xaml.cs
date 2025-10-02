using ChildMotivationApp.Helpers;

namespace ChildMotivationApp
{
    public partial class AppShell : Shell
    {
        private ResponsiveDeviceType _currentDeviceType;

        public AppShell()
        {
            InitializeComponent();
            _currentDeviceType = DeviceHelper.GetDeviceType();
            SetupResponsiveNavigation();
        }

        private void SetupResponsiveNavigation()
        {
            ApplyNavigationForDevice(_currentDeviceType);
        }

        private void ApplyNavigationForDevice(ResponsiveDeviceType deviceType)
        {
            switch (deviceType)
            {
                case ResponsiveDeviceType.Mobile:
                    SetupMobileNavigation();
                    break;
                case ResponsiveDeviceType.Tablet:
                    SetupTabletNavigation();
                    break;
                case ResponsiveDeviceType.Desktop:
                    SetupDesktopNavigation();
                    break;
            }
        }

        private void SetupMobileNavigation()
        {
            // Мобильная навигация: TabBar снизу
            FlyoutBehavior = FlyoutBehavior.Disabled;
            
            // Показываем TabBar
            var mainTabBar = this.FindByName<TabBar>("MainTabBar");
            if (mainTabBar != null)
            {
                mainTabBar.IsVisible = true;
            }

            // Скрываем все FlyoutItems для мобильных
            HideFlyoutItems();
        }

        private void SetupTabletNavigation()
        {
            // Планшетная навигация: гибридный подход
            FlyoutBehavior = FlyoutBehavior.Flyout;
            
            var mainTabBar = this.FindByName<TabBar>("MainTabBar");
            if (mainTabBar != null)
            {
                mainTabBar.IsVisible = true; // Показываем TabBar на планшетах тоже
            }
        }

        private void SetupDesktopNavigation()
        {
            // Десктопная навигация: Flyout Menu слева, без TabBar
            FlyoutBehavior = FlyoutBehavior.Flyout;
            
            // Скрываем TabBar на десктопе
            var mainTabBar = this.FindByName<TabBar>("MainTabBar");
            if (mainTabBar != null)
            {
                mainTabBar.IsVisible = false;
            }

            // Показываем все FlyoutItems
            ShowFlyoutItems();
        }

        private void HideFlyoutItems()
        {
            // Скрываем FlyoutItems для мобильных устройств
            foreach (var item in Items.OfType<FlyoutItem>())
            {
                item.IsVisible = false;
            }
        }

        private void ShowFlyoutItems()
        {
            // Показываем FlyoutItems для планшетов и десктопа
            foreach (var item in Items.OfType<FlyoutItem>())
            {
                item.IsVisible = true;
            }
        }

        protected override void OnSizeAllocated(double width, double height)
        {
            base.OnSizeAllocated(width, height);
            
            // Пересчитываем тип устройства при изменении размера
            var newDeviceType = DeviceHelper.GetDeviceType();
            if (newDeviceType != _currentDeviceType)
            {
                _currentDeviceType = newDeviceType;
                ApplyNavigationForDevice(_currentDeviceType);
            }
        }

        // Метод для программного переключения на основную навигацию после входа
        public void ShowMainNavigation()
        {
            ApplyNavigationForDevice(_currentDeviceType);
        }

        // Метод для скрытия всей навигации (для стартовых страниц)
        public void HideNavigation()
        {
            FlyoutBehavior = FlyoutBehavior.Disabled;
            var mainTabBar = this.FindByName<TabBar>("MainTabBar");
            if (mainTabBar != null)
            {
                mainTabBar.IsVisible = false;
            }
            HideFlyoutItems();
        }
    }
}
