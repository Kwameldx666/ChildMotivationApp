using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPremiumFieldsToProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "products",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsExclusive",
                table: "products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RecommendedAge",
                table: "products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequiredTier",
                table: "products",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "products");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "products");

            migrationBuilder.DropColumn(
                name: "IsExclusive",
                table: "products");

            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "products");

            migrationBuilder.DropColumn(
                name: "RecommendedAge",
                table: "products");

            migrationBuilder.DropColumn(
                name: "RequiredTier",
                table: "products");
        }
    }
}
