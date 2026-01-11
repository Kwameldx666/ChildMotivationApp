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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "tasks");
        }
    }
}