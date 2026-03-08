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
        var child1Id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        var hasDemo = await db.Orders.AnyAsync(o => o.UserId == child1Id);
        if (!hasDemo)
        {
            var logger2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeed");
            logger2.LogInformation("Seeding demo orders...");

            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO orders ("Id","UserId","CreatedAt","Status","TotalAmount",
                    "DeliveredAt","DeliveredByUserId","ConfirmedAt","ConfirmedByUserId","DeliveryNotes")
                VALUES
                ('b1000000-0000-0000-0000-000000000001','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 NOW()-INTERVAL '5 days', 5, 20,
                 NOW()-INTERVAL '5 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 NOW()-INTERVAL '5 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Выбрала наклейку с единорогом!'),
                ('b1000000-0000-0000-0000-000000000002','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 NOW()-INTERVAL '1 day', 3, 30,
                 NOW()-INTERVAL '1 day', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 NULL, NULL, NULL),
                ('b1000000-0000-0000-0000-000000000003','cccccccc-cccc-cccc-cccc-cccccccccccc',
                 NOW()-INTERVAL '3 days', 5, 20,
                 NOW()-INTERVAL '3 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                 NOW()-INTERVAL '3 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL),
                ('b1000000-0000-0000-0000-000000000004','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                 NOW(), 1, 100,
                 NULL, NULL, NULL, NULL, NULL)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO order_items ("Id","OrderId","ProductId","ProductName","UnitPrice","Quantity","LineTotal")
                VALUES
                ('c1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',
                 'a1b2c3d4-1111-4000-8000-000000000001','Наклейка на выбор', 20, 1, 20),
                ('c1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002',
                 'a1b2c3d4-1111-4000-8000-000000000003','Дополнительные 15 минут игры', 30, 1, 30),
                ('c1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000003',
                 'a1b2c3d4-1111-4000-8000-000000000004','Сладкий бонус', 20, 1, 20),
                ('c1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000004',
                 'a1b2c3d4-2222-4000-8000-000000000001','Настольная игра с родителем', 100, 1, 100)
                ON CONFLICT ("Id") DO NOTHING;
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
