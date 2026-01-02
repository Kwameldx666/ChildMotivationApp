using AiService.Application.Abstractions;
using AiService.Infrastructure.Clients;
using AiService.Infrastructure.Options;
using AiService.Infrastructure.Orchestration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiService.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAiInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton(TimeProvider.System);

        services.Configure<AiProviderOptions>(configuration.GetSection(AiProviderOptions.SectionName));

        services.AddSingleton<RuleBasedAiOrchestrator>();
        services.AddHttpClient<OpenAiClient>((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptionsMonitor<AiProviderOptions>>().CurrentValue;
            client.BaseAddress = options.ResolveBaseUri();
            client.Timeout = options.ResolveTimeout();
        });

        services.AddSingleton<IAiOrchestrator>(sp =>
        {
            var optionsMonitor = sp.GetRequiredService<IOptionsMonitor<AiProviderOptions>>();
            var options = optionsMonitor.CurrentValue;
            var fallback = sp.GetRequiredService<RuleBasedAiOrchestrator>();

            if (!options.IsConfigured())
            {
                return fallback;
            }

            var client = sp.GetRequiredService<OpenAiClient>();
            var timeProvider = sp.GetRequiredService<TimeProvider>();
            var logger = sp.GetRequiredService<ILogger<OpenAiOrchestrator>>();
            return new OpenAiOrchestrator(client, fallback, timeProvider, logger);
        });

        return services;
    }
}
