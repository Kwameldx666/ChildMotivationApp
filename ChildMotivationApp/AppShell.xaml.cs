using System.Linq;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.Pages;
using ChildMotivationApp.Pages.Child;

namespace ChildMotivationApp
{
    public partial class AppShell : Shell
    {
        private ResponsiveDeviceType _currentDeviceType;
        private bool _isChildMode;

        public AppShell()
        {
            InitializeComponent();

            // Глобальные маршруты для прямой навигации
            Routing.RegisterRoute("dashboard", typeof(DashboardPage));
            Routing.RegisterRoute("rewards_shop", typeof(RewardsShopPage));
            Routing.RegisterRoute("parent_stats", typeof(ParentStatsPage));
            Routing.RegisterRoute("parent_profile", typeof(ParentProfilePage));
            Routing.RegisterRoute("child_dashboard", typeof(ChildDashboardPage));
            Routing.RegisterRoute("child_rewards_shop", typeof(ChildRewardsPage));
            Routing.RegisterRoute("child_progress_page", typeof(ChildProgressPage));
            Routing.RegisterRoute("child_profile_page", typeof(ChildProfilePage));

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
            SetTabBarsVisibility(!_isChildMode, _isChildMode);
            HideFlyoutItems();
        }

        private void SetupTabletNavigation()
        {
            // Планшетная навигация: гибридный подход
            FlyoutBehavior = FlyoutBehavior.Flyout;
            SetTabBarsVisibility(!_isChildMode, _isChildMode);

            if (_isChildMode)
            {
                HideFlyoutItems();
            }
            else
            {
                ShowFlyoutItems();
            }
        }

        private void SetupDesktopNavigation()
        {
            // Десктопная навигация: Flyout Menu слева
            FlyoutBehavior = FlyoutBehavior.Flyout;

            if (_isChildMode)
            {
                // Для ребёнка оставляем яркие вкладки и скрываем взрослые разделы
                SetTabBarsVisibility(false, true);
                HideFlyoutItems();
            }
            else
            {
                // Для родителя оставляем только Flyout-меню
                SetTabBarsVisibility(false, false);
                ShowFlyoutItems();
            }
        }

        private void HideFlyoutItems()
        {
            // Скрываем FlyoutItems для мобильных устройств или детского режима
            foreach (var item in Items.OfType<FlyoutItem>())
            {
                item.IsVisible = false;
            }
        }

        private void ShowFlyoutItems()
        {
            // Показываем FlyoutItems для планшетов и десктопа во взрослом режиме
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
        public void ShowMainNavigation(bool isChild = false)
        {
            _isChildMode = isChild;
            ApplyNavigationForDevice(_currentDeviceType);
        }

        // Метод для скрытия всей навигации (для стартовых страниц)
        public void HideNavigation()
        {
            FlyoutBehavior = FlyoutBehavior.Disabled;
            SetTabBarsVisibility(false, false);
            HideFlyoutItems();
        }

        private void SetTabBarsVisibility(bool showParentTabBar, bool showChildTabBar)
        {
            var parentTabBar = this.FindByName<TabBar>("ParentTabBar");
            var childTabBar = this.FindByName<TabBar>("ChildTabBar");

            if (parentTabBar != null)
            {
                parentTabBar.IsVisible = showParentTabBar;
            }

            if (childTabBar != null)
            {
                childTabBar.IsVisible = showChildTabBar;
            }

            if (showChildTabBar && childTabBar != null)
            {
                CurrentItem = childTabBar;
            }
            else if (showParentTabBar && parentTabBar != null)
            {
                CurrentItem = parentTabBar;
            }
        }
    }
}
