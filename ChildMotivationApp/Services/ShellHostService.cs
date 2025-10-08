using System;
using System.Linq;
using System.Threading.Tasks;
using ChildMotivationApp;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Services;

public sealed class ShellHostService : IShellHostService
{
    public void ShowMainNavigation()
    {
        if (Application.Current?.MainPage is AppShell shell)
        {
            shell.ShowMainNavigation();
        }
    }

    public void HideNavigation()
    {
        if (Application.Current?.MainPage is AppShell shell)
        {
            shell.HideNavigation();
        }
    }

    public Task<bool> SwitchToTabAsync(string tabRoute, string? contentRoute = null)
    {
        if (string.IsNullOrWhiteSpace(tabRoute))
        {
            return Task.FromResult(false);
        }

        return MainThread.InvokeOnMainThreadAsync(() =>
        {
            if (Application.Current?.MainPage is not AppShell shell)
            {
                return false;
            }

            var tabBars = shell.Items.OfType<TabBar>().ToList();
            if (tabBars.Count == 0)
            {
                return false;
            }

            var targetTabBar = tabBars.FirstOrDefault(tb =>
                !string.IsNullOrWhiteSpace(tb.Route) &&
                string.Equals(tb.Route, "main", StringComparison.OrdinalIgnoreCase))
                ?? tabBars.First();

            var targetSection = targetTabBar.Items.FirstOrDefault(section =>
                string.Equals(section.Route, tabRoute, StringComparison.OrdinalIgnoreCase))
                ?? targetTabBar.Items.FirstOrDefault(section =>
                    string.Equals(section.Title, tabRoute, StringComparison.OrdinalIgnoreCase));

            if (targetSection is null)
            {
                return false;
            }

            shell.CurrentItem = targetTabBar;
            targetTabBar.CurrentItem = targetSection;

            if (!string.IsNullOrWhiteSpace(contentRoute))
            {
                var targetContent = targetSection.Items.FirstOrDefault(content =>
                    string.Equals(content.Route, contentRoute, StringComparison.OrdinalIgnoreCase))
                    ?? targetSection.Items.FirstOrDefault(content =>
                        string.Equals(content.Title, contentRoute, StringComparison.OrdinalIgnoreCase));

                if (targetContent is not null)
                {
                    targetSection.CurrentItem = targetContent;
                }
            }

            return true;
        });
    }
}
