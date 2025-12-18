using FamilyQuest.Gateway.Common.HttpUrls;
using FamilyQuest.Gateway.Infrastructure.Services.Constants;

namespace FamilyQuest.Gateway.Extensions;

public static class PresentationExtension
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddPresentation(IConfiguration configuration)
        {
            services.AddControllers();
            services.AddOpenApi();
            services.AddServiceEndpoints(configuration);
            services.AddNamedHttpClientsConfiguration(configuration);
            return services;
        }

        private void AddServiceEndpoints(IConfiguration configuration)
        {
            services.Configure<AuthEndpoint>(configuration.GetSection("ServiceEndpoints:AuthService"));
        }
        
        private void AddNamedHttpClientsConfiguration(IConfiguration configuration)
        {
            services.AddHttpClient(DefaultHttpClientNames.AuthService, client =>
            {
                var authEndpoint = configuration.GetSection("ServiceEndpoints:AuthService").Get<AuthEndpoint>();
                client.BaseAddress = new Uri(authEndpoint!.AuthEndpointUrl);
            });
        }
    }
}