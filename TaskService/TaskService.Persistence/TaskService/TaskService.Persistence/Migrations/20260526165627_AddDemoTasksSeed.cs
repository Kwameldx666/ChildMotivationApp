using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TaskService.Persistence.TaskService.TaskService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDemoTasksSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PendingApproval",
                table: "tasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "StartedByChild",
                table: "tasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "achievements",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Icon", "IsActive", "RewardXp", "SortOrder", "TargetValue", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("c5d6e7f8-2222-4000-8000-000000000001"), "early-bird", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить задание до 9:00 утра 5 раз", "alarm-clock", true, 120, 7, 5, "Ранняя пташка", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c5d6e7f8-2222-4000-8000-000000000002"), "streak-30", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Серия 30 дней подряд", "shield", true, 800, 8, 30, "Железная воля", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c5d6e7f8-2222-4000-8000-000000000003"), "first-purchase", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Потратить баллы в магазине наград", "shopping-cart", true, 50, 9, 1, "Первая покупка", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c5d6e7f8-2222-4000-8000-000000000004"), "helper-100", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 100 заданий", "medal", true, 1000, 10, 100, "Супер-помощник", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c5d6e7f8-2222-4000-8000-000000000005"), "creative-mind", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 10 заданий из категории творчество", "palette", true, 200, 11, 10, "Творческий ум", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c5d6e7f8-2222-4000-8000-000000000006"), "team-player", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполнить 5 семейных миссий", "users", true, 250, 12, 5, "Командный игрок", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "achievements",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Icon", "IsActive", "IsHidden", "RewardXp", "SortOrder", "TargetValue", "Title", "UpdatedAt" },
                values: new object[] { new Guid("c5d6e7f8-2222-4000-8000-000000000007"), "secret-legend", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "???", "gem", true, true, 5000, 13, 500, "Легенда", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "missions",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Icon", "IsActive", "Recurrence", "RewardXp", "SortOrder", "TargetValue", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("d4e5f6a7-1111-4000-8000-000000000001"), "morning-routine", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполни утреннее задание до 10:00", "sunrise", true, 1, 40, 7, 1, "Утренний ритуал", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d4e5f6a7-1111-4000-8000-000000000002"), "help-family-member", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Помоги другому члену семьи с задачей", "heart-handshake", true, 1, 80, 8, 1, "Семейный помощник", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d4e5f6a7-1111-4000-8000-000000000003"), "earn-hundred-points-weekly", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Заработай 100 очков за неделю", "coins", true, 2, 200, 9, 100, "Сотня за неделю", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d4e5f6a7-1111-4000-8000-000000000004"), "five-different-categories", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Выполни задачи из 5 разных категорий за неделю", "layers", true, 2, 180, 10, 5, "Разносторонний", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "Completed", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "RewardPoints", "RewardXp", "StartedByChild", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("d0000000-0000-0000-0000-000000000001"), "a1000000-0000-0000-0000-000000000002", true, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Выбери любую книгу из домашней библиотеки и прочитай минимум 10 страниц", 2, null, null, null, null, null, null, 5, 100, true, "Прочитать 10 страниц книги", new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d0000000-0000-0000-0000-000000000002"), "a1000000-0000-0000-0000-000000000002", true, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Пропылесосить, сложить вещи, вытереть пыль на столе", 1, null, null, null, null, null, null, 2, 80, true, "Убраться в своей комнате", new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "RewardPoints", "RewardXp", "StartedByChild", "Title", "UpdatedAt" },
                values: new object[] { new Guid("d0000000-0000-0000-0000-000000000003"), "a1000000-0000-0000-0000-000000000002", null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Решить все задания из учебника: упражнения 5.1 - 5.4", 3, null, null, null, null, null, null, 10, 120, true, "Сделать домашнюю работу по математике", new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "RewardPoints", "RewardXp", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("d0000000-0000-0000-0000-000000000004"), "a1000000-0000-0000-0000-000000000002", null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Запомнить новые слова и написать предложение с каждым", 2, null, null, null, null, null, null, 5, 100, "Выучить 5 английских слов", null },
                    { new Guid("d0000000-0000-0000-0000-000000000005"), "a1000000-0000-0000-0000-000000000002", null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Помыть всю посуду и протереть поверхность раковины", 1, null, null, null, null, null, null, 2, 80, "Помыть посуду после ужина", null },
                    { new Guid("d0000000-0000-0000-0000-000000000006"), "a1000000-0000-0000-0000-000000000002", null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Создай рисунок нашей семьи — можно в любой технике!", 4, null, null, null, null, null, null, 20, 140, "Нарисовать семейный портрет", null }
                });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "Completed", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "RewardPoints", "RewardXp", "StartedByChild", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("d0000000-0000-0000-0000-000000000007"), "a1000000-0000-0000-0000-000000000003", true, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Проверить влажность почвы и полить цветы там, где нужно", 1, null, null, null, null, null, null, 2, 80, true, "Полить все комнатные цветы", new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d0000000-0000-0000-0000-000000000008"), "a1000000-0000-0000-0000-000000000003", true, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "«Зимнее утро» Пушкина — выучить и прочитать маме или папе", 3, null, null, null, null, null, null, 10, 120, true, "Выучить стихотворение наизусть", new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "RewardPoints", "RewardXp", "Title", "UpdatedAt" },
                values: new object[] { new Guid("d0000000-0000-0000-0000-000000000009"), "a1000000-0000-0000-0000-000000000003", null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Разложить тарелки, приборы и стаканы для всей семьи", 1, null, null, null, null, null, null, 2, 80, "Помочь накрыть на стол к обеду", null });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "PendingApproval", "RewardPoints", "RewardXp", "StartedByChild", "Title", "UpdatedAt" },
                values: new object[] { new Guid("d0000000-0000-0000-0000-000000000010"), "a1000000-0000-0000-0000-000000000003", null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Приседания, прыжки, растяжка — 15 минут активности", 2, null, null, null, null, null, null, true, 5, 100, true, "Сделать зарядку 15 минут", new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "tasks",
                columns: new[] { "Id", "AssignedToUserId", "CompletedAt", "CreatedAt", "CreatedByUserId", "Description", "Difficulty", "EvidenceContentType", "EvidenceFileName", "EvidenceFileSize", "EvidenceStoragePath", "EvidenceUploadedAt", "EvidenceUploadedBy", "RewardPoints", "RewardXp", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("d0000000-0000-0000-0000-000000000011"), null, null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Придумай правила новой игры, в которую можно играть всей семьёй", 3, null, null, null, null, null, null, 10, 120, "Придумать семейную игру", null },
                    { new Guid("d0000000-0000-0000-0000-000000000012"), null, null, new DateTime(2025, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "a1000000-0000-0000-0000-000000000001", "Поможи соседям или сделай что-то приятное для людей рядом", 4, null, null, null, null, null, null, 20, 140, "Сделать добрый поступок для соседей", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000006"));

            migrationBuilder.DeleteData(
                table: "achievements",
                keyColumn: "Id",
                keyValue: new Guid("c5d6e7f8-2222-4000-8000-000000000007"));

            migrationBuilder.DeleteData(
                table: "missions",
                keyColumn: "Id",
                keyValue: new Guid("d4e5f6a7-1111-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "missions",
                keyColumn: "Id",
                keyValue: new Guid("d4e5f6a7-1111-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "missions",
                keyColumn: "Id",
                keyValue: new Guid("d4e5f6a7-1111-4000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "missions",
                keyColumn: "Id",
                keyValue: new Guid("d4e5f6a7-1111-4000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                table: "tasks",
                keyColumn: "Id",
                keyValue: new Guid("d0000000-0000-0000-0000-000000000012"));

            migrationBuilder.DropColumn(
                name: "PendingApproval",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "StartedByChild",
                table: "tasks");
        }
    }
}
