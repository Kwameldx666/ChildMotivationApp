using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using TaskService.Api.Middlewares;
using TaskService.Application;
using TaskService.Infrastructure.Extensions;
using TaskService.Persistence.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings instead of numbers
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication();

// Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// Persistence (DB)
builder.Services.AddPersistence(builder.Configuration);

builder.Services.AddTransient<ExceptionHandlingMiddleware>();

// JWT Authentication
var jwtSecret = builder.Configuration["JwtBearer:Secret"] ?? "this_dev_secret_is_at_least_32_bytes_long";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        options.MapInboundClaims = false;
    });
builder.Services.AddAuthorization();

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

        // Add PendingApproval column if missing (post-migration patch)
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS \"PendingApproval\" boolean NOT NULL DEFAULT false");

        // ── Seed demo tasks for screenshots ──
        var parentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        var hasDemo = await db.Tasks.AnyAsync(t => t.CreatedByUserId == parentId);
        if (!hasDemo)
        {
            var logger2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeed");
            logger2.LogInformation("Seeding demo tasks...");

            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO tasks ("Id","Title","Description","Completed","CreatedAt","UpdatedAt","CompletedAt",
                    "CreatedByUserId","AssignedToUserId","EvidenceRequirement","Difficulty","RewardXp","RewardPoints")
                VALUES
                -- Completed tasks for Маша
                ('d1000000-0000-0000-0000-000000000001','Убрать комнату','Разложить игрушки, заправить кровать и пропылесосить',
                 true, NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 2, 100, 5),

                ('d1000000-0000-0000-0000-000000000002','Сделать домашнее задание по математике','Решить примеры на странице 45-46',
                 true, NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 3, 120, 10),

                ('d1000000-0000-0000-0000-000000000003','Решить 10 задач по русскому языку','Упражнения из рабочей тетради',
                 true, NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 4, 140, 20),

                -- Pending tasks for Маша
                ('d1000000-0000-0000-0000-000000000004','Почитать книгу 30 минут','Продолжить читать «Гарри Поттер»',
                 false, NOW()-INTERVAL '1 day', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 1, 80, 2),

                ('d1000000-0000-0000-0000-000000000005','Нарисовать рисунок','Нарисовать рисунок на тему «Моя семья» и сфотографировать',
                 false, NOW(), NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 1, 80, 2),

                ('d1000000-0000-0000-0000-000000000006','Полить цветы','Полить все комнатные растения',
                 false, NOW(), NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 1, 80, 2),

                -- Completed tasks for Дима
                ('d1000000-0000-0000-0000-000000000007','Выгулять собаку','Прогулка 20 минут во дворе',
                 true, NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 2, 100, 5),

                ('d1000000-0000-0000-0000-000000000008','Собрать рюкзак на завтра','Проверить расписание и сложить учебники',
                 true, NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 1, 80, 2),

                -- Pending tasks for Дима
                ('d1000000-0000-0000-0000-000000000009','Помочь с ужином','Помочь маме порезать овощи для салата',
                 false, NOW(), NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 2, 100, 5),

                ('d1000000-0000-0000-0000-000000000010','Протереть пыль в гостиной','Протереть полки и подоконники',
                 false, NOW(), NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 3, 120, 10)

                ON CONFLICT ("Id") DO NOTHING;
                """);

            // Seed some task comments
            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO task_comments ("Id","TaskId","UserId","UserName","UserRole","Content","CreatedAt")
                VALUES
                ('e1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001',
                 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Маша','Child','Всё убрала! Даже под кроватью! 😊',
                 NOW()-INTERVAL '3 days'),
                ('e1000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Алексей','Parent','Молодец! Комната блестит ✨',
                 NOW()-INTERVAL '3 days' + INTERVAL '30 minutes'),
                ('e1000000-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000007',
                 'cccccccc-cccc-cccc-cccc-cccccccccccc','Дима','Child','Бобик был очень рад прогулке! 🐕',
                 NOW()-INTERVAL '1 day')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            // Seed achievement/mission progress for demo children
            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO achievement_progress ("Id","AchievementId","UserId","ProgressValue","UpdatedAt","UnlockedAt")
                VALUES
                ('f1000000-0000-0000-0000-000000000001','7b4c0a8c-d745-4bd5-9f78-aa142f7de669',
                 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, NOW(), NULL),
                ('f1000000-0000-0000-0000-000000000002','f6a4f768-3a43-41cf-9d0e-bbc868710f19',
                 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day'),
                ('f1000000-0000-0000-0000-000000000003','7b4c0a8c-d745-4bd5-9f78-aa142f7de669',
                 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, NOW(), NULL)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO mission_progress ("Id","MissionId","UserId","ProgressValue","AnchorDate","UpdatedAt","CompletedAt")
                VALUES
                ('f2000000-0000-0000-0000-000000000001','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1',
                 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, CURRENT_DATE, NOW(), NULL),
                ('f2000000-0000-0000-0000-000000000002','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7',
                 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 15, CURRENT_DATE, NOW(), NULL),
                ('f2000000-0000-0000-0000-000000000003','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1',
                 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, CURRENT_DATE, NOW(), NULL)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            logger2.LogInformation("Demo tasks seeded successfully.");
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupMigrations");
        logger.LogError(ex, "Failed to apply migrations");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();