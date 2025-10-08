using System.Threading.Tasks;

namespace ChildMotivationApp.Services;

public interface IShellHostService
{
    void ShowMainNavigation();
    void HideNavigation();
    Task<bool> SwitchToTabAsync(string tabRoute, string? contentRoute = null);
}
