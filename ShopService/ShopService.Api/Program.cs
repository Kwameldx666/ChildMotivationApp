using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ShopService.Infrastructure.Extensions;
using ShopService.Persistence.Extensions;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure();
builder.Services.AddPersistence(builder.Configuration);

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

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ShopService.Persistence.Context.ShopDbContext>();
        db.Database.Migrate();

        // ── Ensure HasData products exist (migration may not have seeded them) ──
        var productCount = await db.Products.CountAsync();
        if (productCount < 10)
        {
            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO products ("Id","Name","Description","Price","Stock","IsActive","CreatedAt","IsPremium","Category","ImageUrl","IsExclusive")
                VALUES
                ('a1b2c3d4-1111-4000-8000-000000000001','Наклейка на выбор','Ребёнок выбирает одну наклейку из коллекции',20,999,true,'2025-01-01','false','stickers','/icons/sticker.png',false),
                ('a1b2c3d4-1111-4000-8000-000000000002','Выбор музыки в машине','Ребёнок выбирает плейлист на поездку',25,999,true,'2025-01-01',false,'privileges','/icons/music.png',false),
                ('a1b2c3d4-1111-4000-8000-000000000003','Дополнительные 15 минут игры','Ещё 15 минут любимой игры или мультика',30,999,true,'2025-01-01',false,'screen_time','/icons/gamepad.png',false),
                ('a1b2c3d4-1111-4000-8000-000000000004','Сладкий бонус','Одна конфета или печенье на выбор',20,999,true,'2025-01-01',false,'treats','/icons/candy.png',false),
                ('a1b2c3d4-1111-4000-8000-000000000005','Не заправлять кровать','Один день без заправки кровати',40,999,true,'2025-01-01',false,'privileges','/icons/bed.png',false),
                ('a1b2c3d4-2222-4000-8000-000000000001','Настольная игра с родителем','Сесть и сыграть в настолку вместе',100,999,true,'2025-01-01',false,'family','/icons/board-game.png',false),
                ('a1b2c3d4-2222-4000-8000-000000000002','Пикник в гостиной','Расстелить плед и устроить пикник с закусками дома',120,999,true,'2025-01-01',false,'family','/icons/picnic.png',false),
                ('a1b2c3d4-2222-4000-8000-000000000003','Мини-кинотеатр','Выбрать мультфильм и посмотреть с попкорном',150,999,true,'2025-01-01',false,'entertainment','/icons/cinema.png',false),
                ('a1b2c3d4-2222-4000-8000-000000000004','Поход в парк','Провести время на свежем воздухе',200,999,true,'2025-01-01',false,'family','/icons/park.png',false),
                ('a1b2c3d4-3333-4000-8000-000000000001','Поездка в зоопарк','Целый день в зоопарке',500,999,true,'2025-01-01',true,'entertainment','/icons/zoo.png',false)
                ON CONFLICT ("Id") DO NOTHING;
                """);
        }

        // ── Seed demo orders for screenshots ──
        var demoOrdersCount = await db.Orders.CountAsync(o =>
            o.UserId == "a1000000-0000-0000-0000-000000000002" ||
            o.UserId == "a1000000-0000-0000-0000-000000000003");
        if (demoOrdersCount < 8)
        {
            var logger2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeed");
            logger2.LogInformation("Seeding demo orders... current count: {Count}", demoOrdersCount);

            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO orders ("Id","UserId","CreatedAt","Status","TotalAmount",
                    "DeliveredAt","DeliveredByUserId","ConfirmedAt","ConfirmedByUserId","DeliveryNotes")
                VALUES
                ('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
                 NOW()-INTERVAL '5 days', 5, 20,
                 NOW()-INTERVAL '5 days', 'a1000000-0000-0000-0000-000000000001',
                 NOW()-INTERVAL '5 days', 'a1000000-0000-0000-0000-000000000002', 'Выбрала наклейку с единорогом!'),
                ('b1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002',
                 NOW()-INTERVAL '1 day', 3, 30,
                 NOW()-INTERVAL '1 day', 'a1000000-0000-0000-0000-000000000001',
                 NULL, NULL, NULL),
                ('b1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
                 NOW()-INTERVAL '3 days', 5, 20,
                 NOW()-INTERVAL '3 days', 'a1000000-0000-0000-0000-000000000001',
                 NOW()-INTERVAL '3 days', 'a1000000-0000-0000-0000-000000000003', NULL),
                ('b1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002',
                 NOW(), 1, 100,
                 NULL, NULL, NULL, NULL, NULL),
                    ('b1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000002',
                 NOW()-INTERVAL '12 days', 5, 25,
                 NOW()-INTERVAL '11 days 22 hours', 'a1000000-0000-0000-0000-000000000001',
                            await db.Database.ExecuteSqlRawAsync("""
                                INSERT INTO orders ("Id","UserId","CreatedAt","Status","TotalAmount",
                                    "DeliveredAt","DeliveredByUserId","ConfirmedAt","ConfirmedByUserId","DeliveryNotes")
                                VALUES
                                ('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
                                 NOW()-INTERVAL '5 days', 5, 20,
                                 NOW()-INTERVAL '5 days', 'a1000000-0000-0000-0000-000000000001',
                                 NOW()-INTERVAL '5 days', 'a1000000-0000-0000-0000-000000000002', 'Выбрала наклейку с единорогом!'),
                                ('b1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002',
                                 NOW()-INTERVAL '1 day', 3, 30,
                                 NOW()-INTERVAL '1 day', 'a1000000-0000-0000-0000-000000000001',
                                 NULL, NULL, NULL),
                                ('b1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
                                 NOW()-INTERVAL '3 days', 5, 20,
                                 NOW()-INTERVAL '3 days', 'a1000000-0000-0000-0000-000000000001',
                                 NOW()-INTERVAL '3 days', 'a1000000-0000-0000-0000-000000000003', NULL),
                                ('b1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002',
                                 NOW(), 1, 100,
                                 NULL, NULL, NULL, NULL, NULL),
                                ('b1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000002',
                                 NOW()-INTERVAL '12 days', 5, 25,
                                 NOW()-INTERVAL '11 days 22 hours', 'a1000000-0000-0000-0000-000000000001',
                                 NOW()-INTERVAL '11 days 21 hours', 'a1000000-0000-0000-0000-000000000002', 'Музыка в машине на поездку к бабушке'),
                                ('b1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000003',
                                 NOW()-INTERVAL '9 days', 5, 30,
                                 NOW()-INTERVAL '8 days 20 hours', 'a1000000-0000-0000-0000-000000000001',
                                 NOW()-INTERVAL '8 days 18 hours', 'a1000000-0000-0000-0000-000000000003', 'Дополнительное экранное время использовано после уроков'),
                                ('b1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000003',
                                 NOW()-INTERVAL '2 days', 3, 120,
                                 NOW()-INTERVAL '2 days', 'a1000000-0000-0000-0000-000000000001',
                                 NULL, NULL, 'Ожидает подтверждения ребёнком'),
                                ('b1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000002',
                                 NOW()-INTERVAL '6 hours', 2, 20,
                                 NULL, NULL, NULL, NULL, NULL)
                                ON CONFLICT ("Id") DO NOTHING;
                                """);
                """);

            logger2.LogInformation("Demo orders seeded successfully.");
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupMigrations");
        logger.LogError(ex, "Failed to apply migrations for ShopService");
    }
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
