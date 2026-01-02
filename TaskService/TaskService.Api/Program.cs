using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskService.Api.Middlewares;
using TaskService.Application;
using TaskService.Infrastructure.Extensions;
using TaskService.Persistence.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication();

// Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// Persistence (DB)
builder.Services.AddPersistence(builder.Configuration);

builder.Services.AddTransient<ExceptionHandlingMiddleware>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Apply EF migrations automatically on startup in dev/testing environments
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<TaskService.Persistence.Context.TaskDbContext>();
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupMigrations");
        logger.LogError(ex, "Failed to apply migrations");
        // Don't rethrow so container can still start and surface the error to logs
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseRouting();
app.MapControllers();

app.Run();