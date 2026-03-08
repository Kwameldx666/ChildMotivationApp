using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Extensions;
using NotificationService.Infrastructure.Extensions;
using NotificationService.Infrastructure.Persistence;
using NotificationService.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings instead of numbers
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add SignalR
builder.Services.AddSignalR();

// Add Application and Infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRPolicy", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                ?? new[] { "http://localhost:3000", "http://localhost:5173" }
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Required for SignalR
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

// Auto-create database tables
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetService<NotificationDbContext>();
    if (db is not null)
    {
        try
        {
            // EnsureCreated skips if the DB already exists (e.g. created by AuthService).
            // Use raw SQL to guarantee the notifications table is present.
            await db.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id UUID PRIMARY KEY,
                    user_id VARCHAR(128) NOT NULL,
                    type VARCHAR(64) NOT NULL,
                    title VARCHAR(512) NOT NULL,
                    message VARCHAR(2048) NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    data JSONB
                );
                CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);
                CREATE INDEX IF NOT EXISTS ix_notifications_user_id_is_read ON notifications (user_id, is_read);
                CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at);
                """);
            app.Logger.LogInformation("Notification database initialized successfully");

            // ── Seed demo notifications for screenshots ──
            try
            {
                var seedSql = """
                    INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at, data)
                    SELECT * FROM (VALUES
                        ('a3000000-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                         'task_completed', 'Задание выполнено!', 'Ты выполнила задание «Убрать комнату» и получила 100 XP! 🎉',
                         true, NOW()-INTERVAL '3 days', '{"taskId":"d1000000-0000-0000-0000-000000000001","xp":100}'::jsonb),
                        ('a3000000-0000-0000-0000-000000000002'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                         'achievement_unlocked', 'Достижение разблокировано!', 'Ты получила достижение «Быстрая ракета» — 3 задания за день! 🚀',
                         true, NOW()-INTERVAL '1 day', '{"achievementCode":"daily-rocket","xp":50}'::jsonb),
                        ('a3000000-0000-0000-0000-000000000003'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                         'reward_available', 'Новая награда!', 'У тебя достаточно баллов для «Настольная игра с родителем»! 🎲',
                         false, NOW()-INTERVAL '2 hours', NULL),
                        ('a3000000-0000-0000-0000-000000000004'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                         'task_completed', 'Задание выполнено!', 'Ты выполнил задание «Выгулять собаку» и получил 100 XP! 🐕',
                         true, NOW()-INTERVAL '1 day', '{"taskId":"d1000000-0000-0000-0000-000000000007","xp":100}'::jsonb),
                        ('a3000000-0000-0000-0000-000000000005'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                         'reward_delivered', 'Награда получена!', 'Ты получил «Сладкий бонус»! Приятного аппетита! 🍬',
                         true, NOW()-INTERVAL '3 days', '{"orderId":"b1000000-0000-0000-0000-000000000003"}'::jsonb),
                        ('a3000000-0000-0000-0000-000000000006'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                         'child_completed_task', 'Маша выполнила задание!', 'Маша выполнила «Решить 10 задач по русскому языку». Проверьте результат! ✅',
                         false, NOW()-INTERVAL '1 day', '{"taskId":"d1000000-0000-0000-0000-000000000003","childName":"Маша"}'::jsonb),
                        ('a3000000-0000-0000-0000-000000000007'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                         'child_completed_task', 'Дима выполнил задание!', 'Дима выполнил «Выгулять собаку». Проверьте результат! ✅',
                         true, NOW()-INTERVAL '1 day', '{"taskId":"d1000000-0000-0000-0000-000000000007","childName":"Дима"}'::jsonb),
                        ('a3000000-0000-0000-0000-000000000008'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                         'order_created', 'Новый заказ в магазине', 'Маша заказала «Настольная игра с родителем» за 100 баллов 🎲',
                         false, NOW(), '{"orderId":"b1000000-0000-0000-0000-000000000004"}'::jsonb)
                    ) AS v(id, user_id, type, title, message, is_read, created_at, data)
                    WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = 'a3000000-0000-0000-0000-000000000001'::uuid);
                    """;
                var conn = db.Database.GetDbConnection();
                if (conn.State != System.Data.ConnectionState.Open)
                    await conn.OpenAsync();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = seedSql;
                var count = await cmd.ExecuteNonQueryAsync();
                if (count > 0) app.Logger.LogInformation("Demo notifications seeded ({Count} rows).", count);
            }
            catch (Exception seedEx)
            {
                app.Logger.LogWarning(seedEx, "Failed to seed demo notifications");
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Could not initialize notification database, falling back to in-memory storage");
        }
    }
}

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

app.UseCors("SignalRPolicy");

app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Health check endpoints
app.MapGet("/_ping", () => Results.Ok("pong"));
app.MapGet("/notification-service/_ping", () => Results.Ok("pong"));
app.MapGet("/notification-service/health", () => Results.Ok(new { status = "ok" }));

app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            totalDuration = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.ToDictionary(e => e.Key, e => new
            {
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds
            })
        };
        await context.Response.WriteAsJsonAsync(result);
    }
});

app.Run();
