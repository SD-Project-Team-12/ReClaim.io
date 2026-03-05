using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace ReClaim.Api.Migrations
{
    /// <inheritdoc />
    public partial class initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "tbl_identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clerk_id = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    first_name = table.Column<string>(type: "text", nullable: true),
                    last_name = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbl_identity", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tbl_logistics",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_recycler_id = table.Column<Guid>(type: "uuid", nullable: false),
                    geo_spatial = table.Column<Point>(type: "geometry (point)", nullable: false),
                    shard_key = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbl_logistics", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tbl_pickup_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CitizenId = table.Column<string>(type: "text", nullable: false),
                    RecyclerId = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "text", nullable: false),
                    SubCategory = table.Column<string>(type: "text", nullable: true),
                    BrandAndModel = table.Column<string>(type: "text", nullable: true),
                    ItemDescription = table.Column<string>(type: "text", nullable: true),
                    Condition = table.Column<int>(type: "integer", nullable: false),
                    IsPoweringOn = table.Column<bool>(type: "boolean", nullable: false),
                    WeightKg = table.Column<double>(type: "double precision", nullable: false),
                    EstimatedValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FinalPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    PickUpAddress = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    PreferredPickUpTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbl_pickup_requests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tbl_recycler_applications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClerkId = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    NidNumber = table.Column<string>(type: "text", nullable: false),
                    OrganizationName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbl_recycler_applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tbl_recycler_applications_tbl_identity_UserId",
                        column: x => x.UserId,
                        principalTable: "tbl_identity",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_tbl_recycler_applications_UserId",
                table: "tbl_recycler_applications",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tbl_logistics");

            migrationBuilder.DropTable(
                name: "tbl_pickup_requests");

            migrationBuilder.DropTable(
                name: "tbl_recycler_applications");

            migrationBuilder.DropTable(
                name: "tbl_identity");
        }
    }
}
