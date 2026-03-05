using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReClaim.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMultipleImageUrlToPickup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "tbl_pickup_requests");

            migrationBuilder.AddColumn<List<string>>(
                name: "ImageUrls",
                table: "tbl_pickup_requests",
                type: "text[]",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "tbl_pickup_requests");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "tbl_pickup_requests",
                type: "text",
                nullable: true);
        }
    }
}
