using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Services;

public sealed class ShellNavigationService : INavigationService
{
    public Task GoToAsync(string route, IDictionary<string, object?>? parameters = null)
    {
        var shell = Shell.Current;
        if (shell == null)
        {
            return Task.CompletedTask;
        }

        return parameters is null
            ? shell.GoToAsync(route)
            : shell.GoToAsync(route, parameters);
    }

    public Task GoBackAsync()
    {
        var shell = Shell.Current;
        if (shell == null)
        {
            return Task.CompletedTask;
        }

        return shell.GoToAsync("..");
    }
}
