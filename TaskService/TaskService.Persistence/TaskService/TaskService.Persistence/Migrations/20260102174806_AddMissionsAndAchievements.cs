using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TaskService.Persistence.TaskService.TaskService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMissionsAndAchievements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "achievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false, defaultValue: ""),
                    Icon = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false, defaultValue: "trophy"),
                    TargetValue = table.Column<int>(type: "integer", nullable: false),
                    RewardXp = table.Column<int>(type: "integer", nullable: false),
                    IsHidden = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_achievements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "missions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false, defaultValue: ""),
                    Icon = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false, defaultValue: "target"),
                    Recurrence = table.Column<int>(type: "integer", nullable: false),
                    TargetValue = table.Column<int>(type: "integer", nullable: false),
                    RewardXp = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_missions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "achievement_progress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProgressValue = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_achievement_progress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_achievement_progress_achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mission_progress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProgressValue = table.Column<int>(type: "integer", nullable: false),
                    AnchorDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mission_progress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_mission_progress_missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "achievements",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Icon", "IsActive", "RewardXp", "SortOrder", "TargetValue", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("0e87458a-a61a-4e76-9f46-30f3e9a9f329"), "weekly-king", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Стать первым в рейтинге недели", "crown", true, 300, 5, 1, "Король недели", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("419a7a1b-4816-4d5f-9f25-28c52f4a5a42"), "sharp-shooter", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 5 сложных заданий", "target", true, 150, 4, 5, "Точный стрелок", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("7b4c0a8c-d745-4bd5-9f78-aa142f7de669"), "helper-10", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 10 заданий", "star", true, 100, 1, 10, "Юный помощник", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("a8fbe2e9-2f0f-4f0d-8dfc-6f6d6efc5a67"), "streak-7", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Серия 7 дней подряд", "flame", true, 200, 3, 7, "Ни дня без дела!", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b349e60d-9a3d-4b7c-8c26-93a2418f9644"), "task-master-50", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 50 заданий", "trophy", true, 500, 6, 50, "Мастер задач", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("f6a4f768-3a43-41cf-9d0e-bbc868710f19"), "daily-rocket", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 3 задания за день", "zap", true, 50, 2, 3, "Быстрая ракета", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "missions",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Icon", "IsActive", "Recurrence", "RewardXp", "SortOrder", "TargetValue", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("0c6aa8d5-8a2e-4d6a-9d24-62dd9a2c9df4"), "login-seven-days", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Заходи в приложение каждый день", "flame", true, 1, 100, 3, 7, "Логинься 7 дней", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("3a75fa50-7f45-4fa2-98c2-58ff75a1dd1f"), "unlock-three-badges", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Разблокируй 3 достижения на этой неделе", "award", true, 2, 300, 6, 3, "Получи 3 бейджа", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("3f68d135-3a90-4f50-9b8e-5d0af9f3e5a1"), "complete-three-daily-tasks", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполни 3 любых задания до конца дня", "check-circle-2", true, 1, 50, 1, 3, "Выполни 3 задания", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("7f54a8a1-78f1-4e37-8cf1-02ab142d5699"), "complete-twenty-weekly", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполни 20 заданий за неделю", "check-circle-2", true, 2, 250, 5, 20, "Выполни 20 заданий", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("8b54ff19-8e0a-44f2-9315-06cb5c076d16"), "complete-hard-task", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполни задание со сложностью 4+ звёзды", "target", true, 1, 60, 4, 1, "Выполни сложное задание", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("cde995cd-88ee-44bb-9e1a-0ebbf35fb2a7"), "earn-twenty-points", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Получи 20 очков за выполнение задач", "zap", true, 1, 75, 2, 20, "Заработай 20 очков", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_achievement_progress_AchievementId_UserId",
                table: "achievement_progress",
                columns: new[] { "AchievementId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_achievements_Code",
                table: "achievements",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_mission_progress_MissionId_UserId",
                table: "mission_progress",
                columns: new[] { "MissionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_missions_Code",
                table: "missions",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "achievement_progress");

            migrationBuilder.DropTable(
                name: "mission_progress");

            migrationBuilder.DropTable(
                name: "achievements");

            migrationBuilder.DropTable(
                name: "missions");
        }
    }
}
