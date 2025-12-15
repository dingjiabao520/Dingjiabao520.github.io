using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusSmartAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddModelTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModelInfos",
                columns: table => new
                {
                    ModelID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ModelName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Version = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Copyright = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Schema = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ModelType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelInfos", x => x.ModelID);
                });

            migrationBuilder.CreateTable(
                name: "ModelDatas",
                columns: table => new
                {
                    DataID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ModelID = table.Column<int>(type: "int", nullable: false),
                    DataType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DataKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ExternalId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelDatas", x => x.DataID);
                    table.ForeignKey(
                        name: "FK_ModelDatas_ModelInfos_ModelID",
                        column: x => x.ModelID,
                        principalTable: "ModelInfos",
                        principalColumn: "ModelID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ModelParts",
                columns: table => new
                {
                    PartID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ModelID = table.Column<int>(type: "int", nullable: false),
                    PartFileName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PartIndex = table.Column<int>(type: "int", nullable: false),
                    PartType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelParts", x => x.PartID);
                    table.ForeignKey(
                        name: "FK_ModelParts_ModelInfos_ModelID",
                        column: x => x.ModelID,
                        principalTable: "ModelInfos",
                        principalColumn: "ModelID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModelDatas_ModelID_DataType_DataKey",
                table: "ModelDatas",
                columns: new[] { "ModelID", "DataType", "DataKey" });

            migrationBuilder.CreateIndex(
                name: "IX_ModelInfos_ModelName_ModelType",
                table: "ModelInfos",
                columns: new[] { "ModelName", "ModelType" });

            migrationBuilder.CreateIndex(
                name: "IX_ModelParts_ModelID_PartIndex",
                table: "ModelParts",
                columns: new[] { "ModelID", "PartIndex" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModelDatas");

            migrationBuilder.DropTable(
                name: "ModelParts");

            migrationBuilder.DropTable(
                name: "ModelInfos");
        }
    }
}
