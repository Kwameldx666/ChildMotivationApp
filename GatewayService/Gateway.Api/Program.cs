using Gateway.Extensions;
using Gateway.Infrastructure.Extensions;
using Gateway.Middlewares;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddPresentation(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!isRunningInContainer)
{
    app.UseHttpsRedirection();
}
app.UseCors(PresentationExtension.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.UseExceptionHandler(_ => { });
app.MapControllers();

app.Run();
