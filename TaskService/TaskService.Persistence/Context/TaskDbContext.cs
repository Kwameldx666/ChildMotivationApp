using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TaskService.Domain.Entities;
using TaskService.Domain.Enums;

namespace TaskService.Persistence.Context;

public class TaskDbContext(DbContextOptions<TaskDbContext> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks { get; set; } = null!;
    public DbSet<TaskComment> TaskComments { get; set; } = null!;
    public DbSet<Mission> Missions { get; set; } = null!;
    public DbSet<MissionProgress> MissionProgress { get; set; } = null!;
    public DbSet<Achievement> Achievements { get; set; } = null!;
    public DbSet<AchievementProgress> AchievementProgress { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TaskItem>(b =>
        {
            b.ToTable("tasks");
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(256).IsRequired();
            b.Property(x => x.Description).HasMaxLength(2000);
            b.Property(x => x.Completed).HasDefaultValue(false);
            b.Property(x => x.PendingApproval).HasDefaultValue(false);
            b.Property(x => x.StartedByChild).HasDefaultValue(false);
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.UpdatedAt);
            b.Property(x => x.CreatedByUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.AssignedToUserId).HasMaxLength(64);
            b.Property(x => x.EvidenceRequirement)
                .HasConversion<int>()
                .HasDefaultValue(TaskEvidenceRequirement.None)
                .IsRequired();
            b.Property(x => x.EvidenceStoragePath).HasMaxLength(512);
            b.Property(x => x.EvidenceFileName).HasMaxLength(256);
            b.Property(x => x.EvidenceContentType).HasMaxLength(128);
            b.Property(x => x.EvidenceFileSize);
            b.Property(x => x.EvidenceUploadedAt);
            b.Property(x => x.EvidenceUploadedBy).HasMaxLength(64);

            // New: Difficulty and computed rewards
            b.Property(x => x.Difficulty).IsRequired().HasDefaultValue(2);
            b.Property(x => x.RewardXp).IsRequired().HasDefaultValue(60 + 20 * 2);
            b.Property(x => x.RewardPoints).IsRequired().HasDefaultValue(5);
        });

        modelBuilder.Entity<TaskComment>(b =>
        {
            b.ToTable("task_comments");
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.UserName).HasMaxLength(256).IsRequired();
            b.Property(x => x.UserRole).HasMaxLength(32).IsRequired();
            b.Property(x => x.Content).HasMaxLength(2000).IsRequired();
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.UpdatedAt);
            b.HasIndex(x => x.TaskId);
            b.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<Mission>(b =>
        {
            b.ToTable("missions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Code).HasMaxLength(64).IsRequired();
            b.HasIndex(x => x.Code).IsUnique();
            b.Property(x => x.Title).HasMaxLength(256).IsRequired();
            b.Property(x => x.Description).HasMaxLength(2000).HasDefaultValue(string.Empty);
            b.Property(x => x.Icon).HasMaxLength(64).HasDefaultValue("target");
            b.Property(x => x.Recurrence).HasConversion<int>().IsRequired();
            b.Property(x => x.TargetValue).IsRequired();
            b.Property(x => x.RewardXp).IsRequired();
            b.Property(x => x.IsActive).HasDefaultValue(true);
            b.Property(x => x.SortOrder).HasDefaultValue(0);
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.UpdatedAt);
        });

        modelBuilder.Entity<MissionProgress>(b =>
        {
            b.ToTable("mission_progress");
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.MissionId, x.UserId }).IsUnique();
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.ProgressValue).IsRequired();
            b.Property(x => x.AnchorDate).IsRequired();
            b.Property(x => x.UpdatedAt).IsRequired();
            b.Property(x => x.CompletedAt);
            b.HasOne(x => x.Mission)
                .WithMany()
                .HasForeignKey(x => x.MissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Achievement>(b =>
        {
            b.ToTable("achievements");
            b.HasKey(x => x.Id);
            b.Property(x => x.Code).HasMaxLength(64).IsRequired();
            b.HasIndex(x => x.Code).IsUnique();
            b.Property(x => x.Title).HasMaxLength(256).IsRequired();
            b.Property(x => x.Description).HasMaxLength(2000).HasDefaultValue(string.Empty);
            b.Property(x => x.Icon).HasMaxLength(64).HasDefaultValue("trophy");
            b.Property(x => x.TargetValue).IsRequired();
            b.Property(x => x.RewardXp).IsRequired();
            b.Property(x => x.SortOrder).HasDefaultValue(0);
            b.Property(x => x.IsHidden).HasDefaultValue(false);
            b.Property(x => x.IsActive).HasDefaultValue(true);
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.UpdatedAt);
        });

        modelBuilder.Entity<AchievementProgress>(b =>
        {
            b.ToTable("achievement_progress");
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.AchievementId, x.UserId }).IsUnique();
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.ProgressValue).IsRequired();
            b.Property(x => x.UpdatedAt).IsRequired();
            b.Property(x => x.UnlockedAt);
            b.HasOne(x => x.Achievement)
                .WithMany()
                .HasForeignKey(x => x.AchievementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        SeedMissions(modelBuilder);
        SeedAchievements(modelBuilder);
        SeedDemoTasks(modelBuilder);
    }

    private static void SeedMissions(ModelBuilder modelBuilder)
    {
        var seedTimestamp = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Mission>().HasData(
            new
            {
                Id = Guid.Parse("3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1"),
                Code = "complete-three-daily-tasks",
                Title = "Выполни 3 задания",
                Description = "Выполни 3 любых задания до конца дня",
                Icon = "check-circle-2",
                Recurrence = MissionRecurrence.Daily,
                TargetValue = 3,
                RewardXp = 50,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7"),
                Code = "earn-twenty-points",
                Title = "Заработай 20 очков",
                Description = "Получи 20 очков за выполнение задач",
                Icon = "zap",
                Recurrence = MissionRecurrence.Daily,
                TargetValue = 20,
                RewardXp = 75,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("0c6aa8d5-8a2e-4d6a-9d24-62dd9a2c9df4"),
                Code = "login-seven-days",
                Title = "Логинься 7 дней",
                Description = "Заходи в приложение каждый день",
                Icon = "flame",
                Recurrence = MissionRecurrence.Daily,
                TargetValue = 7,
                RewardXp = 100,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("8b54ff19-8e0a-44f2-9315-06cb5c076d16"),
                Code = "complete-hard-task",
                Title = "Выполни сложное задание",
                Description = "Выполни задание со сложностью 4+ звёзды",
                Icon = "target",
                Recurrence = MissionRecurrence.Daily,
                TargetValue = 1,
                RewardXp = 60,
                SortOrder = 4,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("7f54a8a1-78f1-4e37-8cf1-02ab142d5699"),
                Code = "complete-twenty-weekly",
                Title = "Выполни 20 заданий",
                Description = "Выполни 20 заданий за неделю",
                Icon = "check-circle-2",
                Recurrence = MissionRecurrence.Weekly,
                TargetValue = 20,
                RewardXp = 250,
                SortOrder = 5,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("3a75fa50-7f45-4fa2-98c2-58ff75a1dd1f"),
                Code = "unlock-three-badges",
                Title = "Получи 3 бейджа",
                Description = "Разблокируй 3 достижения на этой неделе",
                Icon = "award",
                Recurrence = MissionRecurrence.Weekly,
                TargetValue = 3,
                RewardXp = 300,
                SortOrder = 6,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            // ─── Дополнительные миссии ───
            new
            {
                Id = Guid.Parse("d4e5f6a7-1111-4000-8000-000000000001"),
                Code = "morning-routine",
                Title = "Утренний ритуал",
                Description = "Выполни утреннее задание до 10:00",
                Icon = "sunrise",
                Recurrence = MissionRecurrence.Daily,
                TargetValue = 1,
                RewardXp = 40,
                SortOrder = 7,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("d4e5f6a7-1111-4000-8000-000000000002"),
                Code = "help-family-member",
                Title = "Семейный помощник",
                Description = "Помоги другому члену семьи с задачей",
                Icon = "heart-handshake",
                Recurrence = MissionRecurrence.Daily,
                TargetValue = 1,
                RewardXp = 80,
                SortOrder = 8,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("d4e5f6a7-1111-4000-8000-000000000003"),
                Code = "earn-hundred-points-weekly",
                Title = "Сотня за неделю",
                Description = "Заработай 100 очков за неделю",
                Icon = "coins",
                Recurrence = MissionRecurrence.Weekly,
                TargetValue = 100,
                RewardXp = 200,
                SortOrder = 9,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("d4e5f6a7-1111-4000-8000-000000000004"),
                Code = "five-different-categories",
                Title = "Разносторонний",
                Description = "Выполни задачи из 5 разных категорий за неделю",
                Icon = "layers",
                Recurrence = MissionRecurrence.Weekly,
                TargetValue = 5,
                RewardXp = 180,
                SortOrder = 10,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            });
    }

    private static void SeedAchievements(ModelBuilder modelBuilder)
    {
        var seedTimestamp = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Achievement>().HasData(
            new
            {
                Id = Guid.Parse("7b4c0a8c-d745-4bd5-9f78-aa142f7de669"),
                Code = "helper-10",
                Title = "Юный помощник",
                Description = "Выполнить 10 заданий",
                Icon = "star",
                TargetValue = 10,
                RewardXp = 100,
                SortOrder = 1,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("f6a4f768-3a43-41cf-9d0e-bbc868710f19"),
                Code = "daily-rocket",
                Title = "Быстрая ракета",
                Description = "Выполнить 3 задания за день",
                Icon = "zap",
                TargetValue = 3,
                RewardXp = 50,
                SortOrder = 2,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67"),
                Code = "streak-7",
                Title = "Ни дня без дела!",
                Description = "Серия 7 дней подряд",
                Icon = "flame",
                TargetValue = 7,
                RewardXp = 200,
                SortOrder = 3,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("419a7a1b-4816-4d5f-9f25-28c52f4a5a42"),
                Code = "sharp-shooter",
                Title = "Точный стрелок",
                Description = "Выполнить 5 сложных заданий",
                Icon = "target",
                TargetValue = 5,
                RewardXp = 150,
                SortOrder = 4,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("0e87458a-a61a-4e76-9f46-30f3e9a9f329"),
                Code = "weekly-king",
                Title = "Король недели",
                Description = "Стать первым в рейтинге недели",
                Icon = "crown",
                TargetValue = 1,
                RewardXp = 300,
                SortOrder = 5,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("b349e60d-9a3d-4b7c-8c26-93a2418f9644"),
                Code = "task-master-50",
                Title = "Мастер задач",
                Description = "Выполнить 50 заданий",
                Icon = "trophy",
                TargetValue = 50,
                RewardXp = 500,
                SortOrder = 6,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            // ─── Дополнительные достижения ───
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000001"),
                Code = "early-bird",
                Title = "Ранняя пташка",
                Description = "Выполнить задание до 9:00 утра 5 раз",
                Icon = "alarm-clock",
                TargetValue = 5,
                RewardXp = 120,
                SortOrder = 7,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000002"),
                Code = "streak-30",
                Title = "Железная воля",
                Description = "Серия 30 дней подряд",
                Icon = "shield",
                TargetValue = 30,
                RewardXp = 800,
                SortOrder = 8,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000003"),
                Code = "first-purchase",
                Title = "Первая покупка",
                Description = "Потратить баллы в магазине наград",
                Icon = "shopping-cart",
                TargetValue = 1,
                RewardXp = 50,
                SortOrder = 9,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000004"),
                Code = "helper-100",
                Title = "Супер-помощник",
                Description = "Выполнить 100 заданий",
                Icon = "medal",
                TargetValue = 100,
                RewardXp = 1000,
                SortOrder = 10,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000005"),
                Code = "creative-mind",
                Title = "Творческий ум",
                Description = "Выполнить 10 заданий из категории творчество",
                Icon = "palette",
                TargetValue = 10,
                RewardXp = 200,
                SortOrder = 11,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000006"),
                Code = "team-player",
                Title = "Командный игрок",
                Description = "Выполнить 5 семейных миссий",
                Icon = "users",
                TargetValue = 5,
                RewardXp = 250,
                SortOrder = 12,
                IsHidden = false,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            },
            new
            {
                Id = Guid.Parse("c5d6e7f8-2222-4000-8000-000000000007"),
                Code = "secret-legend",
                Title = "Легенда",
                Description = "???",
                Icon = "gem",
                TargetValue = 500,
                RewardXp = 5000,
                SortOrder = 13,
                IsHidden = true,
                IsActive = true,
                CreatedAt = seedTimestamp,
                UpdatedAt = seedTimestamp
            });
    }

    // Demo GUIDs must match AuthDatabaseInitializer constants
    private const string DemoParentId = "a1000000-0000-0000-0000-000000000001";
    private const string DemoChild1Id = "a1000000-0000-0000-0000-000000000002"; // Никита, 10 лет
    private const string DemoChild2Id = "a1000000-0000-0000-0000-000000000003"; // Маша, 8 лет

    private static void SeedDemoTasks(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<TaskItem>().HasData(
            // ── Задачи для Никиты ────────────────────────────────────────────────
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000001"),
                Title = "Прочитать 10 страниц книги",
                Description = "Выбери любую книгу из домашней библиотеки и прочитай минимум 10 страниц",
                Completed = true,
                PendingApproval = false,
                StartedByChild = true,
                CreatedAt = now,
                UpdatedAt = now,
                CompletedAt = now,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild1Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 2,
                RewardXp = 100,
                RewardPoints = 5,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000002"),
                Title = "Убраться в своей комнате",
                Description = "Пропылесосить, сложить вещи, вытереть пыль на столе",
                Completed = true,
                PendingApproval = false,
                StartedByChild = true,
                CreatedAt = now,
                UpdatedAt = now,
                CompletedAt = now,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild1Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 1,
                RewardXp = 80,
                RewardPoints = 2,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000003"),
                Title = "Сделать домашнюю работу по математике",
                Description = "Решить все задания из учебника: упражнения 5.1 - 5.4",
                Completed = false,
                PendingApproval = false,
                StartedByChild = true,
                CreatedAt = now,
                UpdatedAt = now,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild1Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 3,
                RewardXp = 120,
                RewardPoints = 10,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000004"),
                Title = "Выучить 5 английских слов",
                Description = "Запомнить новые слова и написать предложение с каждым",
                Completed = false,
                PendingApproval = false,
                StartedByChild = false,
                CreatedAt = now,
                UpdatedAt = (DateTime?)null,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild1Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 2,
                RewardXp = 100,
                RewardPoints = 5,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000005"),
                Title = "Помыть посуду после ужина",
                Description = "Помыть всю посуду и протереть поверхность раковины",
                Completed = false,
                PendingApproval = false,
                StartedByChild = false,
                CreatedAt = now,
                UpdatedAt = (DateTime?)null,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild1Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 1,
                RewardXp = 80,
                RewardPoints = 2,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000006"),
                Title = "Нарисовать семейный портрет",
                Description = "Создай рисунок нашей семьи — можно в любой технике!",
                Completed = false,
                PendingApproval = false,
                StartedByChild = false,
                CreatedAt = now,
                UpdatedAt = (DateTime?)null,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild1Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 4,
                RewardXp = 140,
                RewardPoints = 20,
            },

            // ── Задачи для Маши ──────────────────────────────────────────────────
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000007"),
                Title = "Полить все комнатные цветы",
                Description = "Проверить влажность почвы и полить цветы там, где нужно",
                Completed = true,
                PendingApproval = false,
                StartedByChild = true,
                CreatedAt = now,
                UpdatedAt = now,
                CompletedAt = now,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild2Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 1,
                RewardXp = 80,
                RewardPoints = 2,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000008"),
                Title = "Выучить стихотворение наизусть",
                Description = "«Зимнее утро» Пушкина — выучить и прочитать маме или папе",
                Completed = true,
                PendingApproval = false,
                StartedByChild = true,
                CreatedAt = now,
                UpdatedAt = now,
                CompletedAt = now,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild2Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 3,
                RewardXp = 120,
                RewardPoints = 10,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000009"),
                Title = "Помочь накрыть на стол к обеду",
                Description = "Разложить тарелки, приборы и стаканы для всей семьи",
                Completed = false,
                PendingApproval = false,
                StartedByChild = false,
                CreatedAt = now,
                UpdatedAt = (DateTime?)null,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild2Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 1,
                RewardXp = 80,
                RewardPoints = 2,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000010"),
                Title = "Сделать зарядку 15 минут",
                Description = "Приседания, прыжки, растяжка — 15 минут активности",
                Completed = false,
                PendingApproval = true,
                StartedByChild = true,
                CreatedAt = now,
                UpdatedAt = now,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = DemoChild2Id,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 2,
                RewardXp = 100,
                RewardPoints = 5,
            },

            // ── Общие задачи (без назначения) ────────────────────────────────────
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000011"),
                Title = "Придумать семейную игру",
                Description = "Придумай правила новой игры, в которую можно играть всей семьёй",
                Completed = false,
                PendingApproval = false,
                StartedByChild = false,
                CreatedAt = now,
                UpdatedAt = (DateTime?)null,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = (string?)null,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 3,
                RewardXp = 120,
                RewardPoints = 10,
            },
            new
            {
                Id = Guid.Parse("d0000000-0000-0000-0000-000000000012"),
                Title = "Сделать добрый поступок для соседей",
                Description = "Поможи соседям или сделай что-то приятное для людей рядом",
                Completed = false,
                PendingApproval = false,
                StartedByChild = false,
                CreatedAt = now,
                UpdatedAt = (DateTime?)null,
                CompletedAt = (DateTime?)null,
                CreatedByUserId = DemoParentId,
                AssignedToUserId = (string?)null,
                EvidenceRequirement = TaskEvidenceRequirement.None,
                EvidenceStoragePath = (string?)null,
                EvidenceFileName = (string?)null,
                EvidenceContentType = (string?)null,
                EvidenceFileSize = (long?)null,
                EvidenceUploadedAt = (DateTime?)null,
                EvidenceUploadedBy = (string?)null,
                Difficulty = 4,
                RewardXp = 140,
                RewardPoints = 20,
            }
        );
    }
}