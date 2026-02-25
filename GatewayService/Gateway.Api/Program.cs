using Gateway.Extensions;
using Gateway.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddPresentation(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Serve static files (avatars, etc.)
app.UseStaticFiles();

var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!isRunningInContainer) app.UseHttpsRedirection();

// Add correlation ID first to track all requests
app.UseCorrelationId();

// Add request logging
app.UseRequestLogging();

app.UseCors(PresentationExtension.CorsPolicyName);
app.Use(async (context, next) =>
{
    if (!context.Request.Headers.ContainsKey("Authorization") &&
        context.Request.Cookies.TryGetValue("access_token", out var accessToken) &&
        !string.IsNullOrWhiteSpace(accessToken))
        context.Request.Headers.Authorization = $"Bearer {accessToken}";

    await next();
});
app.UseAuthentication();
app.UseAuthorization();
app.UseExceptionHandler(_ => { });
app.MapControllers();

app.Run();