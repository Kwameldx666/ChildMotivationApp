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

        // Add StartedByChild column if missing (status should only move to in-progress after child starts)
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS \"StartedByChild\" boolean NOT NULL DEFAULT false");

        // ── Seed demo tasks for screenshots (old aaaaaaaa family) ──
        var parentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        var demoTaskCount = await db.Tasks.CountAsync(t => t.CreatedByUserId == parentId);
        if (demoTaskCount < 18)
        {
            var logger2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeed");
            logger2.LogInformation("Seeding demo tasks... current count: {Count}", demoTaskCount);

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
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 3, 120, 10),

                -- Family-wide tasks (shown to children as common tasks)
                ('d1000000-0000-0000-0000-000000000011','Подготовить семейный вечер','Выбрать игру и подготовить настольный стол',
                 false, NOW()-INTERVAL '6 hours', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',NULL, 0, 2, 100, 8),

                ('d1000000-0000-0000-0000-000000000012','Собрать идеи для выходных','Каждый предлагает 2 идеи для прогулки',
                 false, NOW()-INTERVAL '5 hours', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',NULL, 0, 2, 90, 6),

                -- Extra tasks for Маша
                ('d1000000-0000-0000-0000-000000000013','Повторить английские слова','Выучить 12 слов из карточек и прочитать вслух',
                 false, NOW()-INTERVAL '8 hours', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 3, 130, 12),

                ('d1000000-0000-0000-0000-000000000014','Собрать портфель заранее','Проверить дневник и подготовить учебники на завтра',
                 true, NOW()-INTERVAL '12 hours', NOW()-INTERVAL '11 hours', NOW()-INTERVAL '11 hours',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 1, 70, 3),

                ('d1000000-0000-0000-0000-000000000015','Сделать фото поделки','Собрать поделку и отправить фото для подтверждения',
                 false, NOW()-INTERVAL '4 hours', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 2, 100, 8),

                -- Extra tasks for Дима
                ('d1000000-0000-0000-0000-000000000016','Потренировать чтение','Прочитать 4 страницы и пересказать',
                 false, NOW()-INTERVAL '7 hours', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 2, 100, 8),

                ('d1000000-0000-0000-0000-000000000017','Собрать конструктор по схеме','Собрать модель и показать родителю',
                 true, NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days',
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 3, 140, 14),

                ('d1000000-0000-0000-0000-000000000018','Подготовить одежду на завтра','Аккуратно сложить форму и носки',
                 false, NOW()-INTERVAL '3 hours', NULL, NULL,
                 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 1, 70, 3)

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

        // ── Seed Family 1: Ивановы (a1000000-...) ──
        const string p1 = "a1000000-0000-0000-0000-000000000001";
        const string c1 = "a1000000-0000-0000-0000-000000000002"; // Никита
        const string c2 = "a1000000-0000-0000-0000-000000000003"; // Маша
        var f1TaskCount = await db.Tasks.CountAsync(t => t.CreatedByUserId == p1);
        if (f1TaskCount < 30)
        {
            var log1 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeedF1");
            log1.LogInformation("Seeding Family 1 rich demo data...");

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO tasks ("Id","Title","Description","Completed","PendingApproval","StartedByChild",
                    "CreatedAt","UpdatedAt","CompletedAt","CreatedByUserId","AssignedToUserId",
                    "EvidenceRequirement","Difficulty","RewardXp","RewardPoints")
                VALUES
                -- Никита: выполненные (разные дни)
                ('d1100000-0000-0000-0000-000000000001','Прочитать главу книги','Любая книга, минимум 1 глава',
                 true,false,true, NOW()-INTERVAL '28 days',NOW()-INTERVAL '28 days',NOW()-INTERVAL '28 days','{p1}','{c1}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000002','Убраться в комнате','Пропылесосить и разложить вещи',
                 true,false,true, NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days','{p1}','{c1}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000003','Сделать математику','Упражнения 6.1-6.3',
                 true,false,true, NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days','{p1}','{c1}',0,3,120,10),
                ('d1100000-0000-0000-0000-000000000004','Выучить 5 слов на английском','Записать и произнести вслух',
                 true,false,true, NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days','{p1}','{c1}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000005','Помыть посуду','После ужина помыть всё',
                 true,false,true, NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days','{p1}','{c1}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000006','Нарисовать открытку','Для бабушки на день рождения',
                 true,false,true, NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days','{p1}','{c1}',0,3,120,10),
                ('d1100000-0000-0000-0000-000000000007','Сделать зарядку','15 минут упражнений',
                 true,false,true, NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days','{p1}','{c1}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000008','Полить цветы','Все горшки в квартире',
                 true,false,true, NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days','{p1}','{c1}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000009','Решить задачи по физике','Раздел 4, задачи 1-5',
                 true,false,true, NOW()-INTERVAL '13 days',NOW()-INTERVAL '13 days',NOW()-INTERVAL '13 days','{p1}','{c1}',0,4,140,20),
                ('d1100000-0000-0000-0000-000000000010','Собрать рюкзак','Проверить список учебников',
                 true,false,true, NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days','{p1}','{c1}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000011','Прочитать статью','На любую интересную тему',
                 true,false,true, NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days','{p1}','{c1}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000012','Написать сочинение','Описание любимого места',
                 true,false,true, NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days','{p1}','{c1}',0,3,120,10),
                ('d1100000-0000-0000-0000-000000000013','Помочь с ужином','Порезать овощи и накрыть стол',
                 true,false,true, NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days','{p1}','{c1}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000014','Выучить стихотворение','Пушкин - Осень',
                 true,false,true, NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days','{p1}','{c1}',0,3,120,10),
                -- Никита: текущие задачи
                ('d1100000-0000-0000-0000-000000000015','Подготовить доклад','По истории России, 5 минут',
                 false,false,true, NOW()-INTERVAL '1 day',NOW()-INTERVAL '12 hours',NULL,'{p1}','{c1}',0,4,140,20),
                ('d1100000-0000-0000-0000-000000000016','Убраться на столе','Разобрать все бумаги',
                 false,false,false, NOW()-INTERVAL '6 hours',NULL,NULL,'{p1}','{c1}',0,1,80,2),
                -- Маша: выполненные
                ('d1100000-0000-0000-0000-000000000017','Нарисовать семью','Цветными карандашами',
                 true,false,true, NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days','{p1}','{c2}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000018','Полить цветы','Проверить каждый горшок',
                 true,false,true, NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days','{p1}','{c2}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000019','Сделать задание по чтению','Прочитать 10 страниц',
                 true,false,true, NOW()-INTERVAL '23 days',NOW()-INTERVAL '23 days',NOW()-INTERVAL '23 days','{p1}','{c2}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000020','Помочь накрыть стол','К обеду для всей семьи',
                 true,false,true, NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days','{p1}','{c2}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000021','Сделать домашнее задание','Русский язык, упражнение 34',
                 true,false,true, NOW()-INTERVAL '18 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '18 days','{p1}','{c2}',0,3,120,10),
                ('d1100000-0000-0000-0000-000000000022','Спеть песню','Выучить и исполнить любимую песню',
                 true,false,true, NOW()-INTERVAL '16 days',NOW()-INTERVAL '16 days',NOW()-INTERVAL '16 days','{p1}','{c2}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000023','Убраться в детской','Игрушки по местам, пол подмести',
                 true,false,true, NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days','{p1}','{c2}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000024','Сделать поделку','Из бумаги — оригами',
                 true,false,true, NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days','{p1}','{c2}',0,3,120,10),
                ('d1100000-0000-0000-0000-000000000025','Почитать перед сном','30 минут самостоятельного чтения',
                 true,false,true, NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days','{p1}','{c2}',0,1,80,2),
                ('d1100000-0000-0000-0000-000000000026','Написать письмо бабушке','Поздравить с праздником',
                 true,false,true, NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days','{p1}','{c2}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000027','Сделать зарядку утром','10 минут упражнений',
                 true,false,true, NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days','{p1}','{c2}',0,2,100,5),
                ('d1100000-0000-0000-0000-000000000028','Помыть посуду вечером','После ужина',
                 true,false,true, NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days','{p1}','{c2}',0,1,80,2),
                -- Маша: текущие (одна на проверку)
                ('d1100000-0000-0000-0000-000000000029','Нарисовать животное','На конкурс рисунков',
                 false,true,true, NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day',NULL,'{p1}','{c2}',0,3,120,10),
                ('d1100000-0000-0000-0000-000000000030','Собрать пазл','500 деталей, всей семьёй',
                 false,false,false, NOW()-INTERVAL '3 hours',NULL,NULL,'{p1}','{c2}',0,2,100,5)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO task_comments ("Id","TaskId","UserId","UserName","UserRole","Content","CreatedAt")
                VALUES
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000003','{c1}','Никита','Child',
                 'Сделал все упражнения, получилось! 📐',NOW()-INTERVAL '24 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000003','{p1}','Алексей','Parent',
                 'Отлично, проверю вечером 👍',NOW()-INTERVAL '24 days'+INTERVAL '20 minutes'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000006','{c1}','Никита','Child',
                 'Открытка готова, нарисовал цветы и сердечко 🌸',NOW()-INTERVAL '19 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000006','{p1}','Алексей','Parent',
                 'Бабушке очень понравится! ❤️',NOW()-INTERVAL '19 days'+INTERVAL '15 minutes'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000009','{c1}','Никита','Child',
                 'Задачи по физике — сложно, но справился 💪',NOW()-INTERVAL '13 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000009','{p1}','Алексей','Parent',
                 'Молодец! За сложные задачи — двойная похвала 🏆',NOW()-INTERVAL '13 days'+INTERVAL '30 minutes'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000012','{c1}','Никита','Child',
                 'Написал про парк около дома, вышло на две страницы',NOW()-INTERVAL '7 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000012','{p1}','Алексей','Parent',
                 'Прочитал, очень образно описал! 📝',NOW()-INTERVAL '7 days'+INTERVAL '45 minutes'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000015','{p1}','Алексей','Parent',
                 'Никита, тема доклада — Пётр Первый. Жду!',NOW()-INTERVAL '1 day'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000015','{c1}','Никита','Child',
                 'Уже читаю, буду готов завтра',NOW()-INTERVAL '23 hours'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000021','{c2}','Маша','Child',
                 'Выполнила все упражнения, проверь пожалуйста 🙏',NOW()-INTERVAL '18 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000021','{p1}','Алексей','Parent',
                 'Проверил — всё верно, умница! ⭐',NOW()-INTERVAL '18 days'+INTERVAL '1 hour'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000029','{c2}','Маша','Child',
                 'Нарисовала котика, отправляю на проверку 🐱',NOW()-INTERVAL '2 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000029','{p1}','Алексей','Parent',
                 'Очень милый рисунок! Утверждаю 🎨',NOW()-INTERVAL '1 day'+INTERVAL '2 hours'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000024','{c2}','Маша','Child',
                 'Сделала журавлика и лягушку! Показать тебе?',NOW()-INTERVAL '12 days'),
                ('{Guid.NewGuid()}','d1100000-0000-0000-0000-000000000024','{p1}','Алексей','Parent',
                 'Конечно! Принеси покажи вечером 🐸',NOW()-INTERVAL '12 days'+INTERVAL '30 minutes')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO achievement_progress ("Id","AchievementId","UserId","ProgressValue","UpdatedAt","UnlockedAt")
                VALUES
                -- Никита: достижения
                ('f3000000-0000-0000-0000-000000000001','7b4c0a8c-d745-4bd5-9f78-aa142f7de669','{c1}',10,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
                ('f3000000-0000-0000-0000-000000000002','f6a4f768-3a43-41cf-9d0e-bbc868710f19','{c1}',3,NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days'),
                ('f3000000-0000-0000-0000-000000000003','a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67','{c1}',7,NOW()-INTERVAL '3 days',NULL),
                ('f3000000-0000-0000-0000-000000000004','419a7a1b-4816-4d5f-9f25-28c52f4a5a42','{c1}',2,NOW()-INTERVAL '13 days',NULL),
                ('f3000000-0000-0000-0000-000000000005','b349e60d-9a3d-4b7c-8c26-93a2418f9644','{c1}',14,NOW()-INTERVAL '5 days',NULL),
                ('f3000000-0000-0000-0000-000000000006','c5d6e7f8-2222-4000-8000-000000000001','{c1}',3,NOW()-INTERVAL '11 days',NULL),
                -- Маша: достижения
                ('f3000000-0000-0000-0000-000000000007','7b4c0a8c-d745-4bd5-9f78-aa142f7de669','{c2}',10,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),
                ('f3000000-0000-0000-0000-000000000008','f6a4f768-3a43-41cf-9d0e-bbc868710f19','{c2}',3,NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days'),
                ('f3000000-0000-0000-0000-000000000009','a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67','{c2}',7,NOW()-INTERVAL '2 days',NULL),
                ('f3000000-0000-0000-0000-000000000010','c5d6e7f8-2222-4000-8000-000000000005','{c2}',4,NOW()-INTERVAL '14 days',NULL),
                ('f3000000-0000-0000-0000-000000000011','b349e60d-9a3d-4b7c-8c26-93a2418f9644','{c2}',12,NOW()-INTERVAL '4 days',NULL),
                ('f3000000-0000-0000-0000-000000000012','0e87458a-a61a-4e76-9f46-30f3e9a9f329','{c2}',1,NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO mission_progress ("Id","MissionId","UserId","ProgressValue","AnchorDate","UpdatedAt","CompletedAt")
                VALUES
                -- Никита: миссии
                ('f5000000-0000-0000-0000-000000000001','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1','{c1}',3,CURRENT_DATE,NOW(),NOW()-INTERVAL '2 hours'),
                ('f5000000-0000-0000-0000-000000000002','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7','{c1}',17,CURRENT_DATE,NOW(),NULL),
                ('f5000000-0000-0000-0000-000000000003','7f54a8a1-78f1-4e37-8cf1-02ab142d5699','{c1}',9,CURRENT_DATE-7,NOW()-INTERVAL '2 days',NULL),
                ('f5000000-0000-0000-0000-000000000004','d4e5f6a7-1111-4000-8000-000000000003','{c1}',42,CURRENT_DATE-7,NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days'),
                -- Маша: миссии
                ('f5000000-0000-0000-0000-000000000005','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1','{c2}',3,CURRENT_DATE,NOW(),NOW()-INTERVAL '1 hour'),
                ('f5000000-0000-0000-0000-000000000006','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7','{c2}',20,CURRENT_DATE,NOW(),NOW()),
                ('f5000000-0000-0000-0000-000000000007','8b54ff19-8e0a-44f2-9315-06cb5c076d16','{c2}',1,CURRENT_DATE,NOW(),NOW()-INTERVAL '4 hours'),
                ('f5000000-0000-0000-0000-000000000008','d4e5f6a7-1111-4000-8000-000000000001','{c2}',1,CURRENT_DATE,NOW(),NOW()-INTERVAL '5 hours')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            log1.LogInformation("Family 1 rich demo data seeded successfully.");
        }

        // ── Seed Family 2: Петровы (a2000000-...) ──
        const string p2 = "a2000000-0000-0000-0000-000000000001";
        const string c3 = "a2000000-0000-0000-0000-000000000002"; // Максим
        const string c4 = "a2000000-0000-0000-0000-000000000003"; // Соня
        var f2TaskCount = await db.Tasks.CountAsync(t => t.CreatedByUserId == p2);
        if (f2TaskCount < 30)
        {
            var log2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeedF2");
            log2.LogInformation("Seeding Family 2 rich demo data...");

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO tasks ("Id","Title","Description","Completed","PendingApproval","StartedByChild",
                    "CreatedAt","UpdatedAt","CompletedAt","CreatedByUserId","AssignedToUserId",
                    "EvidenceRequirement","Difficulty","RewardXp","RewardPoints")
                VALUES
                -- Максим: выполненные
                ('d2000000-0000-0000-0000-000000000001','Решить задачи по программированию','Scratch — проект с анимацией',
                 true,false,true, NOW()-INTERVAL '28 days',NOW()-INTERVAL '28 days',NOW()-INTERVAL '28 days','{p2}','{c3}',0,4,140,20),
                ('d2000000-0000-0000-0000-000000000002','Прочитать главу','«Остров сокровищ», глава 5',
                 true,false,true, NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days','{p2}','{c3}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000003','Сделать физкультуру','Отжаться 20 раз, пресс 30 раз',
                 true,false,true, NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days','{p2}','{c3}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000004','Убраться в комнате','Чисто, красиво, по местам',
                 true,false,true, NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days','{p2}','{c3}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000005','Решить пример по математике','Дроби и уравнения',
                 true,false,true, NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days','{p2}','{c3}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000006','Выучить слова по английскому','Тема «Природа», 8 слов',
                 true,false,true, NOW()-INTERVAL '18 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '18 days','{p2}','{c3}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000007','Помочь с обедом','Помыть овощи и накрыть стол',
                 true,false,true, NOW()-INTERVAL '16 days',NOW()-INTERVAL '16 days',NOW()-INTERVAL '16 days','{p2}','{c3}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000008','Написать реферат','Про космос, 1 страница',
                 true,false,true, NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days','{p2}','{c3}',0,4,140,20),
                ('d2000000-0000-0000-0000-000000000009','Вынести мусор','И помыть ведро',
                 true,false,true, NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days','{p2}','{c3}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000010','Позвонить дедушке','Поговорить 10 минут',
                 true,false,true, NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days','{p2}','{c3}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000011','Сделать доклад по биологии','Тема «Экосистемы»',
                 true,false,true, NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days','{p2}','{c3}',0,4,140,20),
                ('d2000000-0000-0000-0000-000000000012','Починить велосипед','Накачать колёса и смазать цепь',
                 true,false,true, NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days','{p2}','{c3}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000013','Убрать на кухне','Помыть раковину и протереть стол',
                 true,false,true, NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days','{p2}','{c3}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000014','Сыграть мелодию на гитаре','Разучить «Yesterday»',
                 true,false,true, NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days','{p2}','{c3}',0,3,120,10),
                -- Максим: текущие
                ('d2000000-0000-0000-0000-000000000015','Выучить теорему Пифагора','Объяснить маме своими словами',
                 false,false,true, NOW()-INTERVAL '1 day',NOW()-INTERVAL '10 hours',NULL,'{p2}','{c3}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000016','Подготовить презентацию','5 слайдов о любимой игре',
                 false,false,false, NOW()-INTERVAL '4 hours',NULL,NULL,'{p2}','{c3}',0,3,120,10),
                -- Соня: выполненные
                ('d2000000-0000-0000-0000-000000000017','Слепить из пластилина','Любое животное',
                 true,false,true, NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days','{p2}','{c4}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000018','Прочитать сказку','«Снежная королева»',
                 true,false,true, NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days','{p2}','{c4}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000019','Выучить таблицу умножения','На 7 и 8',
                 true,false,true, NOW()-INTERVAL '23 days',NOW()-INTERVAL '23 days',NOW()-INTERVAL '23 days','{p2}','{c4}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000020','Убраться в комнате','Все игрушки на полку',
                 true,false,true, NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days','{p2}','{c4}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000021','Нарисовать зимний пейзаж','Акварельными красками',
                 true,false,true, NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days','{p2}','{c4}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000022','Помыть посуду','После завтрака',
                 true,false,true, NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days','{p2}','{c4}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000023','Выучить стих','«Мороз и солнце» Пушкин',
                 true,false,true, NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days','{p2}','{c4}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000024','Собрать конструктор','По инструкции, без помощи',
                 true,false,true, NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days','{p2}','{c4}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000025','Написать письмо другу','О летних планах',
                 true,false,true, NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days','{p2}','{c4}',0,2,100,5),
                ('d2000000-0000-0000-0000-000000000026','Помочь маме с ужином','Нарезать салат',
                 true,false,true, NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days','{p2}','{c4}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000027','Поиграть с младшим котёнком','30 минут',
                 true,false,true, NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days','{p2}','{c4}',0,1,80,2),
                ('d2000000-0000-0000-0000-000000000028','Сделать аппликацию','Цветок из цветной бумаги',
                 true,false,true, NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days','{p2}','{c4}',0,2,100,5),
                -- Соня: текущие
                ('d2000000-0000-0000-0000-000000000029','Нарисовать портрет мамы','На 8 марта',
                 false,true,true, NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day',NULL,'{p2}','{c4}',0,3,120,10),
                ('d2000000-0000-0000-0000-000000000030','Выучить английские буквы','Все 26 букв алфавита',
                 false,false,false, NOW()-INTERVAL '5 hours',NULL,NULL,'{p2}','{c4}',0,2,100,5)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO task_comments ("Id","TaskId","UserId","UserName","UserRole","Content","CreatedAt")
                VALUES
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000001','{c3}','Максим','Child',
                 'Сделал игру в Scratch — там персонаж прыгает через препятствия! 🎮',NOW()-INTERVAL '28 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000001','{p2}','Ольга','Parent',
                 'Показал папе — он тоже хочет поиграть 😄',NOW()-INTERVAL '28 days'+INTERVAL '1 hour'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000003','{c3}','Максим','Child',
                 'Отжался 25 раз! Побил свой рекорд 💪',NOW()-INTERVAL '24 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000003','{p2}','Ольга','Parent',
                 'Вот это сила! Так держать, чемпион 🏋️',NOW()-INTERVAL '24 days'+INTERVAL '30 minutes'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000008','{c3}','Максим','Child',
                 'Написал про Марс и Юпитер. Можно добавить про чёрные дыры? 🌌',NOW()-INTERVAL '14 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000008','{p2}','Ольга','Parent',
                 'Конечно! Чёрные дыры — это интересно 🔭',NOW()-INTERVAL '14 days'+INTERVAL '20 minutes'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000011','{c3}','Максим','Child',
                 'Доклад готов, 8 слайдов получилось',NOW()-INTERVAL '8 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000011','{p2}','Ольга','Parent',
                 'Посмотрела — здорово структурировал! ⭐',NOW()-INTERVAL '8 days'+INTERVAL '40 minutes'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000015','{p2}','Ольга','Parent',
                 'Максим, объяснишь мне теорему вечером?',NOW()-INTERVAL '1 day'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000015','{c3}','Максим','Child',
                 'Да, нарисую треугольник и объясню! 📐',NOW()-INTERVAL '22 hours'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000021','{c4}','Соня','Child',
                 'Нарисовала заснеженный лес с домиком! 🏠❄️',NOW()-INTERVAL '19 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000021','{p2}','Ольга','Parent',
                 'Повешу на холодильник! Очень красиво 🎨',NOW()-INTERVAL '19 days'+INTERVAL '25 minutes'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000023','{c4}','Соня','Child',
                 'Выучила! Можно прочитаю прямо сейчас?',NOW()-INTERVAL '15 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000023','{p2}','Ольга','Parent',
                 'Читай! Я слушаю 👂',NOW()-INTERVAL '15 days'+INTERVAL '5 minutes'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000029','{c4}','Соня','Child',
                 'Мама, я нарисовала тебя с цветами! Нравится? 🌷',NOW()-INTERVAL '2 days'),
                ('{Guid.NewGuid()}','d2000000-0000-0000-0000-000000000029','{p2}','Ольга','Parent',
                 'Соня, это лучший подарок в моей жизни! ❤️',NOW()-INTERVAL '2 days'+INTERVAL '10 minutes')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO achievement_progress ("Id","AchievementId","UserId","ProgressValue","UpdatedAt","UnlockedAt")
                VALUES
                -- Максим: достижения
                ('f4000000-0000-0000-0000-000000000001','7b4c0a8c-d745-4bd5-9f78-aa142f7de669','{c3}',10,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),
                ('f4000000-0000-0000-0000-000000000002','f6a4f768-3a43-41cf-9d0e-bbc868710f19','{c3}',3,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'),
                ('f4000000-0000-0000-0000-000000000003','419a7a1b-4816-4d5f-9f25-28c52f4a5a42','{c3}',5,NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days'),
                ('f4000000-0000-0000-0000-000000000004','a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67','{c3}',7,NOW()-INTERVAL '2 days',NULL),
                ('f4000000-0000-0000-0000-000000000005','b349e60d-9a3d-4b7c-8c26-93a2418f9644','{c3}',14,NOW()-INTERVAL '6 days',NULL),
                ('f4000000-0000-0000-0000-000000000006','0e87458a-a61a-4e76-9f46-30f3e9a9f329','{c3}',1,NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days'),
                -- Соня: достижения
                ('f4000000-0000-0000-0000-000000000007','7b4c0a8c-d745-4bd5-9f78-aa142f7de669','{c4}',10,NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days'),
                ('f4000000-0000-0000-0000-000000000008','f6a4f768-3a43-41cf-9d0e-bbc868710f19','{c4}',3,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
                ('f4000000-0000-0000-0000-000000000009','a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67','{c4}',5,NOW()-INTERVAL '5 days',NULL),
                ('f4000000-0000-0000-0000-000000000010','c5d6e7f8-2222-4000-8000-000000000005','{c4}',6,NOW()-INTERVAL '19 days',NULL),
                ('f4000000-0000-0000-0000-000000000011','b349e60d-9a3d-4b7c-8c26-93a2418f9644','{c4}',12,NOW()-INTERVAL '3 days',NULL),
                ('f4000000-0000-0000-0000-000000000012','c5d6e7f8-2222-4000-8000-000000000003','{c4}',1,NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO mission_progress ("Id","MissionId","UserId","ProgressValue","AnchorDate","UpdatedAt","CompletedAt")
                VALUES
                -- Максим: миссии
                ('f6000000-0000-0000-0000-000000000001','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1','{c3}',3,CURRENT_DATE,NOW(),NOW()-INTERVAL '3 hours'),
                ('f6000000-0000-0000-0000-000000000002','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7','{c3}',20,CURRENT_DATE,NOW(),NOW()-INTERVAL '1 hour'),
                ('f6000000-0000-0000-0000-000000000003','7f54a8a1-78f1-4e37-8cf1-02ab142d5699','{c3}',14,CURRENT_DATE-7,NOW()-INTERVAL '1 day',NULL),
                ('f6000000-0000-0000-0000-000000000004','8b54ff19-8e0a-44f2-9315-06cb5c076d16','{c3}',1,CURRENT_DATE,NOW()-INTERVAL '8 hours',NOW()-INTERVAL '8 hours'),
                -- Соня: миссии
                ('f6000000-0000-0000-0000-000000000005','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1','{c4}',2,CURRENT_DATE,NOW(),NULL),
                ('f6000000-0000-0000-0000-000000000006','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7','{c4}',15,CURRENT_DATE,NOW(),NULL),
                ('f6000000-0000-0000-0000-000000000007','d4e5f6a7-1111-4000-8000-000000000001','{c4}',1,CURRENT_DATE,NOW(),NOW()-INTERVAL '6 hours'),
                ('f6000000-0000-0000-0000-000000000008','d4e5f6a7-1111-4000-8000-000000000003','{c4}',80,CURRENT_DATE-7,NOW()-INTERVAL '2 days',NULL)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            log2.LogInformation("Family 2 rich demo data seeded successfully.");
        }

        // ── Seed Family 3: Сидоровы (a3000000-...) ──
        const string p3 = "a3000000-0000-0000-0000-000000000001";
        const string c5 = "a3000000-0000-0000-0000-000000000002"; // Артём
        const string c6 = "a3000000-0000-0000-0000-000000000003"; // Лиза
        var f3TaskCount = await db.Tasks.CountAsync(t => t.CreatedByUserId == p3);
        if (f3TaskCount < 30)
        {
            var log3 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DemoSeedF3");
            log3.LogInformation("Seeding Family 3 rich demo data...");

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO tasks ("Id","Title","Description","Completed","PendingApproval","StartedByChild",
                    "CreatedAt","UpdatedAt","CompletedAt","CreatedByUserId","AssignedToUserId",
                    "EvidenceRequirement","Difficulty","RewardXp","RewardPoints")
                VALUES
                -- Артём: выполненные
                ('d3000000-0000-0000-0000-000000000001','Собрать модель самолёта','По инструкции, склеить и покрасить',
                 true,false,true, NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days','{p3}','{c5}',0,4,140,20),
                ('d3000000-0000-0000-0000-000000000002','Прочитать главу книги','«Приключения Тома Сойера»',
                 true,false,true, NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days','{p3}','{c5}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000003','Сделать физкультуру','Подтянуться 10 раз',
                 true,false,true, NOW()-INTERVAL '23 days',NOW()-INTERVAL '23 days',NOW()-INTERVAL '23 days','{p3}','{c5}',0,3,120,10),
                ('d3000000-0000-0000-0000-000000000004','Убраться на полках','Разложить книги и вещи по порядку',
                 true,false,true, NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days','{p3}','{c5}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000005','Решить задачи по химии','Задачи на молярную массу',
                 true,false,true, NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days','{p3}','{c5}',0,4,140,20),
                ('d3000000-0000-0000-0000-000000000006','Изучить флаги стран','Выучить 10 флагов Европы',
                 true,false,true, NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days','{p3}','{c5}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000007','Помыть машину','Помочь папе помыть автомобиль',
                 true,false,true, NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days','{p3}','{c5}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000008','Написать эссе','На тему «Моя будущая профессия»',
                 true,false,true, NOW()-INTERVAL '13 days',NOW()-INTERVAL '13 days',NOW()-INTERVAL '13 days','{p3}','{c5}',0,4,140,20),
                ('d3000000-0000-0000-0000-000000000009','Вынести мусор','И протереть мусорное ведро',
                 true,false,true, NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days','{p3}','{c5}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000010','Поиграть в шахматы','Сыграть партию с папой',
                 true,false,true, NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days','{p3}','{c5}',0,3,120,10),
                ('d3000000-0000-0000-0000-000000000011','Сделать доклад по географии','Страна на выбор, 6 фактов',
                 true,false,true, NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days','{p3}','{c5}',0,3,120,10),
                ('d3000000-0000-0000-0000-000000000012','Выучить стихотворение','Лермонтов — «Бородино»',
                 true,false,true, NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days','{p3}','{c5}',0,3,120,10),
                ('d3000000-0000-0000-0000-000000000013','Починить скворечник','Прибить отвалившуюся дощечку',
                 true,false,true, NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days','{p3}','{c5}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000014','Помочь бабушке','Поход в магазин за продуктами',
                 true,false,true, NOW()-INTERVAL '1 day',NOW()-INTERVAL '1 day',NOW()-INTERVAL '1 day','{p3}','{c5}',0,2,100,5),
                -- Артём: текущие
                ('d3000000-0000-0000-0000-000000000015','Подготовить проект по физике','Электрическая цепь своими руками',
                 false,false,true, NOW()-INTERVAL '18 hours',NOW()-INTERVAL '10 hours',NULL,'{p3}','{c5}',0,5,160,50),
                ('d3000000-0000-0000-0000-000000000016','Составить план на лето','Список дел и мест для посещения',
                 false,false,false, NOW()-INTERVAL '3 hours',NULL,NULL,'{p3}','{c5}',0,2,100,5),
                -- Лиза: выполненные
                ('d3000000-0000-0000-0000-000000000017','Нарисовать радугу','Красками, все 7 цветов',
                 true,false,true, NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days','{p3}','{c6}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000018','Выучить алфавит','Все буквы по порядку',
                 true,false,true, NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days','{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000019','Убрать игрушки','По ящикам и полкам',
                 true,false,true, NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days','{p3}','{c6}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000020','Слепить семью из пластилина','Папу, маму, себя и братика',
                 true,false,true, NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days','{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000021','Выучить счёт до 100','Прямой и обратный',
                 true,false,true, NOW()-INTERVAL '18 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '18 days','{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000022','Полить огород','Полить все грядки из лейки',
                 true,false,true, NOW()-INTERVAL '16 days',NOW()-INTERVAL '16 days',NOW()-INTERVAL '16 days','{p3}','{c6}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000023','Прочитать сказку вслух','«Три медведя»',
                 true,false,true, NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days','{p3}','{c6}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000024','Нарисовать животных','5 разных животных',
                 true,false,true, NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days','{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000025','Застелить постель','Сама, аккуратно',
                 true,false,true, NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days','{p3}','{c6}',0,1,80,2),
                ('d3000000-0000-0000-0000-000000000026','Выучить дни недели','По-русски и по-английски',
                 true,false,true, NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days','{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000027','Сделать открытку папе','На день рождения',
                 true,false,true, NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days','{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000028','Помочь накрыть на стол','К завтраку',
                 true,false,true, NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days','{p3}','{c6}',0,1,80,2),
                -- Лиза: текущие
                ('d3000000-0000-0000-0000-000000000029','Нарисовать принцессу','Для конкурса рисунков в садике',
                 false,true,true, NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day',NULL,'{p3}','{c6}',0,2,100,5),
                ('d3000000-0000-0000-0000-000000000030','Собрать пазл из 100 деталей','Картина с котятами',
                 false,false,false, NOW()-INTERVAL '2 hours',NULL,NULL,'{p3}','{c6}',0,1,80,2)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO task_comments ("Id","TaskId","UserId","UserName","UserRole","Content","CreatedAt")
                VALUES
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000001','{c5}','Артём','Child',
                 'Собрал! Крылья пришлось переклеивать, но получилось классно ✈️',NOW()-INTERVAL '27 days'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000001','{p3}','Дмитрий','Parent',
                 'Поставим на полку, будет украшением! 👍',NOW()-INTERVAL '27 days'+INTERVAL '30 minutes'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000005','{c5}','Артём','Child',
                 'Разобрался с молярной массой, задачи решил. Химия — это интересно!',NOW()-INTERVAL '19 days'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000005','{p3}','Дмитрий','Parent',
                 'Молодец, сложная тема! Покажи тетрадь вечером ⚗️',NOW()-INTERVAL '19 days'+INTERVAL '15 minutes'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000008','{c5}','Артём','Child',
                 'Написал про инженера. Думаю стать программистом или конструктором 🔧',NOW()-INTERVAL '13 days'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000008','{p3}','Дмитрий','Parent',
                 'Обе профессии отличные! Прочитал — написано уверенно 📄',NOW()-INTERVAL '13 days'+INTERVAL '1 hour'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000015','{p3}','Дмитрий','Parent',
                 'Артём, нужны: провода, лампочка, батарейка. Есть в ящике стола.',NOW()-INTERVAL '18 hours'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000015','{c5}','Артём','Child',
                 'Нашёл! Уже собираю, лампочка зажглась 💡',NOW()-INTERVAL '10 hours'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000015','{p3}','Дмитрий','Parent',
                 'Отлично! Сфоткай для портфолио 📸',NOW()-INTERVAL '9 hours'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000020','{c6}','Лиза','Child',
                 'Папа, я тебя слепила большим! Ты самый большой 😄',NOW()-INTERVAL '20 days'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000020','{p3}','Дмитрий','Parent',
                 'Хаха, я польщён! Храним на видном месте ❤️',NOW()-INTERVAL '20 days'+INTERVAL '10 minutes'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000027','{c6}','Лиза','Child',
                 'Папочка с днём рождения! Я нарисовала торт и шарики 🎂🎈',NOW()-INTERVAL '6 days'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000027','{p3}','Дмитрий','Parent',
                 'Лизонька, это лучший подарок! Спасибо, моя радость 🥰',NOW()-INTERVAL '6 days'+INTERVAL '5 minutes'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000029','{c6}','Лиза','Child',
                 'Папа, посмотри — принцесса с короной! Нравится?',NOW()-INTERVAL '2 days'),
                ('{Guid.NewGuid()}','d3000000-0000-0000-0000-000000000029','{p3}','Дмитрий','Parent',
                 'Красавица! Утверждаю, отправляй на конкурс 👑',NOW()-INTERVAL '1 day'+INTERVAL '3 hours')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO achievement_progress ("Id","AchievementId","UserId","ProgressValue","UpdatedAt","UnlockedAt")
                VALUES
                -- Артём: достижения
                ('f7000000-0000-0000-0000-000000000001','7b4c0a8c-d745-4bd5-9f78-aa142f7de669','{c5}',10,NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days'),
                ('f7000000-0000-0000-0000-000000000002','f6a4f768-3a43-41cf-9d0e-bbc868710f19','{c5}',3,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
                ('f7000000-0000-0000-0000-000000000003','419a7a1b-4816-4d5f-9f25-28c52f4a5a42','{c5}',5,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days'),
                ('f7000000-0000-0000-0000-000000000004','a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67','{c5}',7,NOW()-INTERVAL '1 day',NULL),
                ('f7000000-0000-0000-0000-000000000005','b349e60d-9a3d-4b7c-8c26-93a2418f9644','{c5}',14,NOW()-INTERVAL '5 days',NULL),
                ('f7000000-0000-0000-0000-000000000006','0e87458a-a61a-4e76-9f46-30f3e9a9f329','{c5}',1,NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days'),
                -- Лиза: достижения
                ('f7000000-0000-0000-0000-000000000007','7b4c0a8c-d745-4bd5-9f78-aa142f7de669','{c6}',10,NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days'),
                ('f7000000-0000-0000-0000-000000000008','f6a4f768-3a43-41cf-9d0e-bbc868710f19','{c6}',3,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),
                ('f7000000-0000-0000-0000-000000000009','a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67','{c6}',4,NOW()-INTERVAL '3 days',NULL),
                ('f7000000-0000-0000-0000-000000000010','c5d6e7f8-2222-4000-8000-000000000005','{c6}',7,NOW()-INTERVAL '20 days',NULL),
                ('f7000000-0000-0000-0000-000000000011','b349e60d-9a3d-4b7c-8c26-93a2418f9644','{c6}',12,NOW()-INTERVAL '4 days',NULL),
                ('f7000000-0000-0000-0000-000000000012','c5d6e7f8-2222-4000-8000-000000000003','{c6}',1,NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days')
                ON CONFLICT ("Id") DO NOTHING;
                """);

            await db.Database.ExecuteSqlRawAsync($"""
                INSERT INTO mission_progress ("Id","MissionId","UserId","ProgressValue","AnchorDate","UpdatedAt","CompletedAt")
                VALUES
                -- Артём: миссии
                ('f8000000-0000-0000-0000-000000000001','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1','{c5}',3,CURRENT_DATE,NOW(),NOW()-INTERVAL '4 hours'),
                ('f8000000-0000-0000-0000-000000000002','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7','{c5}',20,CURRENT_DATE,NOW(),NOW()-INTERVAL '2 hours'),
                ('f8000000-0000-0000-0000-000000000003','8b54ff19-8e0a-44f2-9315-06cb5c076d16','{c5}',1,CURRENT_DATE,NOW()-INTERVAL '5 hours',NOW()-INTERVAL '5 hours'),
                ('f8000000-0000-0000-0000-000000000004','7f54a8a1-78f1-4e37-8cf1-02ab142d5699','{c5}',14,CURRENT_DATE-7,NOW()-INTERVAL '1 day',NULL),
                -- Лиза: миссии
                ('f8000000-0000-0000-0000-000000000005','3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1','{c6}',2,CURRENT_DATE,NOW(),NULL),
                ('f8000000-0000-0000-0000-000000000006','cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7','{c6}',12,CURRENT_DATE,NOW(),NULL),
                ('f8000000-0000-0000-0000-000000000007','d4e5f6a7-1111-4000-8000-000000000001','{c6}',1,CURRENT_DATE,NOW(),NOW()-INTERVAL '7 hours'),
                ('f8000000-0000-0000-0000-000000000008','d4e5f6a7-1111-4000-8000-000000000003','{c6}',65,CURRENT_DATE-7,NOW()-INTERVAL '2 days',NULL)
                ON CONFLICT ("Id") DO NOTHING;
                """);

            log3.LogInformation("Family 3 rich demo data seeded successfully.");
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