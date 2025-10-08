using ChildMotivationApp.Helpers;
using ChildMotivationApp.Pages;
using ChildMotivationApp.Services;
using ChildMotivationApp.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ChildMotivationApp
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    // Используем системные шрифты, которые поддерживают кириллицу
                    // OpenSans не поддерживает кириллицу должным образом
                    // fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    // fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                });

            builder.Services.AddSingleton<INavigationService, ShellNavigationService>();
            builder.Services.AddSingleton<IDialogService, DialogService>();
            builder.Services.AddSingleton<IShellHostService, ShellHostService>();
            builder.Services.AddSingleton<IModalService, ModalService>();
            builder.Services.AddSingleton<IClipboardService, ClipboardService>();

            builder.Services.AddSingleton<RewardsShopPageViewModel>();
            builder.Services.AddTransient<RewardsShopPage>();

            builder.Services.AddTransient<WelcomePageViewModel>();
            builder.Services.AddTransient<WelcomePage>();

            builder.Services.AddTransient<RoleSelectionPageViewModel>();
            builder.Services.AddTransient<RoleSelectionPage>();

            builder.Services.AddTransient<ProfileSetupPageViewModel>();
            builder.Services.AddTransient<ProfileSetupPage>();

            builder.Services.AddTransient<CreateFamilyPageViewModel>();
            builder.Services.AddTransient<CreateFamilyPage>();

            builder.Services.AddTransient<DashboardPageViewModel>();
            builder.Services.AddTransient<DashboardPage>();

            builder.Services.AddTransient<ParentProfilePageViewModel>();
            builder.Services.AddTransient<ParentProfilePage>();

            builder.Services.AddTransient<ParentStatsPageViewModel>();
            builder.Services.AddTransient<ParentStatsPage>();

            builder.Services.AddTransient<CreateTaskModalViewModel>();
            builder.Services.AddTransient<CreateTaskModal>();

#if DEBUG
    		builder.Logging.AddDebug();
#endif

            var app = builder.Build();
            ServiceHelper.Initialize(app.Services);

            return app;
        }
    }
}
