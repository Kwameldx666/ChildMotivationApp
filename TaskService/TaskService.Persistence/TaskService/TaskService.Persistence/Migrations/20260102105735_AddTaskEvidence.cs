using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskService.Persistence.TaskService.TaskService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidenceContentType",
                table: "tasks",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvidenceFileName",
                table: "tasks",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "EvidenceFileSize",
                table: "tasks",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EvidenceRequirement",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "EvidenceStoragePath",
                table: "tasks",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EvidenceUploadedAt",
                table: "tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvidenceUploadedBy",
                table: "tasks",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidenceContentType",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "EvidenceFileName",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "EvidenceFileSize",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "EvidenceRequirement",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "EvidenceStoragePath",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "EvidenceUploadedAt",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "EvidenceUploadedBy",
                table: "tasks");
        }
    }
}
