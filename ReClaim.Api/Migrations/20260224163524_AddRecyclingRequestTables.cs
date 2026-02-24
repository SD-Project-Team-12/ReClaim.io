using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace ReClaim.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecyclingRequestTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tbl_recycling_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    seller_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    recycler_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    pickup_location = table.Column<Point>(type: "geometry(Point, 4326)", nullable: false),
                    address_details = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbl_recycling_requests", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tbl_request_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recycling_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    estimated_weight_kg = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    photo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    predicted_value = table.Column<decimal>(type: "numeric(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbl_request_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_tbl_request_items_tbl_recycling_requests_recycling_request_~",
                        column: x => x.recycling_request_id,
                        principalTable: "tbl_recycling_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tbl_request_items_recycling_request_id",
                table: "tbl_request_items",
                column: "recycling_request_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tbl_request_items");

            migrationBuilder.DropTable(
                name: "tbl_recycling_requests");
        }
    }
}
