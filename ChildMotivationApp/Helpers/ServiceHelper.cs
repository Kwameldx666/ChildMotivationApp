using System;
using Microsoft.Extensions.DependencyInjection;

namespace ChildMotivationApp.Helpers;

public static class ServiceHelper
{
    public static IServiceProvider ServiceProvider { get; private set; } = default!;

    public static void Initialize(IServiceProvider serviceProvider)
    {
        ServiceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
    }

    public static T GetRequiredService<T>() where T : notnull
    {
        if (ServiceProvider is null)
        {
            throw new InvalidOperationException("Service provider is not initialized.");
        }

        return ServiceProvider.GetRequiredService<T>();
    }
}
