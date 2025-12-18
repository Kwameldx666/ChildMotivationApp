using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Extensions;

public static class PresentationExtension
{
    public const string CorsPolicyName = "GatewayCorsPolicy";

    extension(IServiceCollection services)
    {
        public void AddPresentation(IConfiguration configuration)
        {
            services.AddControllers();
            services.AddAuthEndpointConfiguration(configuration);
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
            services.AddCorsPolicy(configuration);
            services.AddNamedHttpClientsConfiguration();
        }

        private void AddAuthEndpointConfiguration(IConfiguration configuration)
        {
            services.Configure<AuthEndpoint>(configuration.GetSection("ServiceEndpoints:AuthService"));
        }

        private void AddNamedHttpClientsConfiguration()
        {
            services.AddHttpClient(DefaultHttpClientNames.AuthService)
                .ConfigureHttpClient((sp, client) =>
                {
                    var endpoint = sp.GetRequiredService<IOptionsMonitor<AuthEndpoint>>().CurrentValue;
                    if (string.IsNullOrWhiteSpace(endpoint.AuthEndpointUrl))
                    {
                        throw new InvalidOperationException("Auth service endpoint is not configured.");
                    }

                    client.BaseAddress = new Uri(endpoint.AuthEndpointUrl);
                });
        }

        private void AddCorsPolicy(IConfiguration configuration)
        {
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        
            services.AddCors(options =>
            {
                options.AddPolicy(CorsPolicyName, builder =>
                {
                    builder.WithOrigins(allowedOrigins!)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });
        }
    }
}