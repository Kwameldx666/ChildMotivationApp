using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskService.Persistence.TaskService.TaskService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDifficulty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Difficulty",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "RewardXp",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 100);

            migrationBuilder.AddColumn<int>(
                name: "RewardPoints",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 5);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RewardPoints",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "RewardXp",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "tasks");
        }
    }
}