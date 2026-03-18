using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UserService.Api.Authorization;
using UserService.Application.Extensions;
using UserService.Infrastructure.Extensions;
using UserService.Persistence.Context;
using UserService.Persistence.Extensions;

var builder = WebApplication.CreateBuilder(args);

var jwtSection = builder.Configuration.GetSection("JwtBearer");

builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings instead of numbers
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.RequireHttpsMetadata = false;
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidIssuer = jwtSection["Issuer"],
			ValidateAudience = true,
			ValidAudience = jwtSection["Audience"],
			ValidateIssuerSigningKey = true,
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Secret"]!)),
			ValidateLifetime = true,
			ClockSkew = TimeSpan.Zero
		};
		options.MapInboundClaims = false;
	});
builder.Services.AddAuthorization(options =>
{
	options.AddPolicy(AuthorizationConstants.UserReadPolicy,
		policy => policy.RequireClaim(AuthorizationConstants.ScopeClaimType, AuthorizationConstants.UserReadPolicy));
	options.AddPolicy(AuthorizationConstants.UserWritePolicy,
		policy => policy.RequireClaim(AuthorizationConstants.ScopeClaimType, AuthorizationConstants.UserWritePolicy));
});

var app = builder.Build();

// Apply migrations automatically
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    await dbContext.Database.MigrateAsync();

    // ── Seed demo subscription + family messages for screenshots ──
    try
    {
        var parentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var seedLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeed");
        var userExists = await dbContext.Users.AnyAsync(u => u.Id == parentId);
        if (!userExists)
        {
            seedLogger.LogInformation("Demo parent user not found yet, skipping subscription/messages seed.");
        }
        else
        {
            var hasSub = await dbContext.Subscriptions.AnyAsync(s => s.UserId == parentId);
            if (!hasSub)
            {
                await dbContext.Database.ExecuteSqlRawAsync("""
                    INSERT INTO subscriptions (id, user_id, tier, status, start_date, end_date,
                        auto_renew, price_per_month, max_children, max_tasks_per_day,
                        has_ai_assistant, has_advanced_analytics, has_custom_rewards,
                        has_priority_support, has_family_sharing, has_offline_mode, created_at, updated_at)
                    VALUES
                    ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                     'Basic', 'Active', NOW()-INTERVAL '30 days', NOW()+INTERVAL '335 days',
                     true, 4.99, 5, 20,
                     false, true, true, false, true, false, NOW()-INTERVAL '30 days', NOW())
                    ON CONFLICT (id) DO NOTHING;
                    """);
            }

            var familyMessageCount = await dbContext.FamilyMessages.CountAsync(m => m.FamilyId == "DEMO2025");
            if (familyMessageCount < 14)
            {
                await dbContext.Database.ExecuteSqlRawAsync("""
                INSERT INTO family_messages ("Id","FamilyId","SenderId","Content","CreatedAt","IsRead","MentionedTaskId","ReplyToMessageId")
                VALUES
                ('a2000000-0000-0000-0000-000000000001','DEMO2025','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 'Привет, ребята! Сегодня добавил новые задания. Посмотрите! 📋',
                 NOW()-INTERVAL '4 hours', true, NULL, NULL),
                ('a2000000-0000-0000-0000-000000000002','DEMO2025','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 'Пап, я уже убрала комнату! Даже пропылесосила! 🎉',
                 NOW()-INTERVAL '3 hours 30 minutes', true, 'd1000000-0000-0000-0000-000000000001', NULL),
                ('a2000000-0000-0000-0000-000000000003','DEMO2025','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 'Молодец, Маша! Отличная работа 👏',
                 NOW()-INTERVAL '3 hours', true, NULL, 'a2000000-0000-0000-0000-000000000002'),
                ('a2000000-0000-0000-0000-000000000004','DEMO2025','cccccccc-cccc-cccc-cccc-cccccccccccc',
                 'А я выгулял Бобика! Он был очень рад 🐕',
                 NOW()-INTERVAL '2 hours', true, 'd1000000-0000-0000-0000-000000000007', NULL),
                ('a2000000-0000-0000-0000-000000000005','DEMO2025','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 'Отлично, ребята! Вы оба большие молодцы! Продолжайте в том же духе 🌟',
                 NOW()-INTERVAL '1 hour 30 minutes', true, NULL, NULL),
                ('a2000000-0000-0000-0000-000000000006','DEMO2025','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 'Я хочу заработать на настольную игру! Сколько ещё баллов нужно?',
                 NOW()-INTERVAL '45 minutes', false, NULL, NULL),
                ('a2000000-0000-0000-0000-000000000007','DEMO2025','cccccccc-cccc-cccc-cccc-cccccccccccc',
                 'А мне на сладкий бонус хватило! 🍬',
                 NOW()-INTERVAL '30 minutes', false, NULL, NULL),
                ('a2000000-0000-0000-0000-000000000008','DEMO2025','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 'Добавил семейные задания без назначения — можете выбрать любое и взять в работу 👨‍👧‍👦',
                 NOW()-INTERVAL '25 minutes', false, 'd1000000-0000-0000-0000-000000000011', NULL),
                ('a2000000-0000-0000-0000-000000000009','DEMO2025','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 'Я беру задание про семейный вечер! Подготовлю настолку 🎲',
                 NOW()-INTERVAL '20 minutes', false, 'd1000000-0000-0000-0000-000000000011', NULL),
                ('a2000000-0000-0000-0000-000000000010','DEMO2025','cccccccc-cccc-cccc-cccc-cccccccccccc',
                 'А я соберу идеи для выходных! Уже придумал две 🚴',
                 NOW()-INTERVAL '18 minutes', false, 'd1000000-0000-0000-0000-000000000012', NULL),
                ('a2000000-0000-0000-0000-000000000011','DEMO2025','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 'Супер, команда! Вечером обсудим ваши идеи и выберем лучший план 📝',
                 NOW()-INTERVAL '15 minutes', false, NULL, NULL),
                ('a2000000-0000-0000-0000-000000000012','DEMO2025','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 'Я ещё сделала английские карточки. Можно потом проверить? 📚',
                 NOW()-INTERVAL '10 minutes', false, 'd1000000-0000-0000-0000-000000000013', NULL),
                ('a2000000-0000-0000-0000-000000000013','DEMO2025','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 'Конечно! После ужина устроим мини-квиз по словам ✅',
                 NOW()-INTERVAL '8 minutes', false, NULL, 'a2000000-0000-0000-0000-000000000012'),
                ('a2000000-0000-0000-0000-000000000014','DEMO2025','cccccccc-cccc-cccc-cccc-cccccccccccc',
                 'Я тоже готов! И можно потом выбрать мультик как награду? 😄',
                 NOW()-INTERVAL '5 minutes', false, NULL, NULL)
                ON CONFLICT ("Id") DO NOTHING;
                """);
                }

                seedLogger.LogInformation("Demo subscription/messages seed completed. HasSub={HasSub}, FamilyMessages={Count}", hasSub, familyMessageCount);
            }
    }
    catch (Exception ex)
    {
        var seedLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeed");
        seedLogger.LogWarning(ex, "Failed to seed demo messages (may retry on next restart)");
    }
}

// Serve static files (avatars, etc.) from wwwroot
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
