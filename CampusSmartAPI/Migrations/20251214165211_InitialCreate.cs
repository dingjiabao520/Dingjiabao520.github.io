using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusSmartAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Areas",
                columns: table => new
                {
                    AreaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AreaName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AreaType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ParentAreaID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Areas", x => x.AreaID);
                    table.ForeignKey(
                        name: "FK_Areas_Areas_ParentAreaID",
                        column: x => x.ParentAreaID,
                        principalTable: "Areas",
                        principalColumn: "AreaID");
                });

            migrationBuilder.CreateTable(
                name: "Devices",
                columns: table => new
                {
                    DeviceID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeviceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    InstallationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LastMaintenanceDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Longitude = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Latitude = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Devices", x => x.DeviceID);
                });

            migrationBuilder.CreateTable(
                name: "WeatherData",
                columns: table => new
                {
                    WeatherID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecordDate = table.Column<DateOnly>(type: "date", nullable: false),
                    RecordTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Temperature = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Humidity = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WindSpeed = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WindDirection = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WeatherCondition = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Precipitation = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    UVIndex = table.Column<int>(type: "int", nullable: true),
                    AirQualityIndex = table.Column<int>(type: "int", nullable: true),
                    WeatherSource = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeatherData", x => x.WeatherID);
                });

            migrationBuilder.CreateTable(
                name: "EnvironmentData",
                columns: table => new
                {
                    DataID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceID = table.Column<int>(type: "int", nullable: false),
                    RecordTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Temperature = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Humidity = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WindSpeed = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WindDirection = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PM25 = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PM10 = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CO2 = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Noise = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnvironmentData", x => x.DataID);
                    table.ForeignKey(
                        name: "FK_EnvironmentData_Devices_DeviceID",
                        column: x => x.DeviceID,
                        principalTable: "Devices",
                        principalColumn: "DeviceID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrafficData",
                columns: table => new
                {
                    TrafficID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceID = table.Column<int>(type: "int", nullable: false),
                    RecordTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrafficFlow = table.Column<int>(type: "int", nullable: true),
                    AverageSpeed = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CongestionLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    VehicleTypeDistribution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrafficData", x => x.TrafficID);
                    table.ForeignKey(
                        name: "FK_TrafficData_Devices_DeviceID",
                        column: x => x.DeviceID,
                        principalTable: "Devices",
                        principalColumn: "DeviceID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Areas_ParentAreaID",
                table: "Areas",
                column: "ParentAreaID");

            migrationBuilder.CreateIndex(
                name: "IX_Devices_Status",
                table: "Devices",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentData_DeviceID_RecordTime",
                table: "EnvironmentData",
                columns: new[] { "DeviceID", "RecordTime" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_TrafficData_DeviceID_RecordTime",
                table: "TrafficData",
                columns: new[] { "DeviceID", "RecordTime" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_WeatherData_RecordDate",
                table: "WeatherData",
                column: "RecordDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Areas");

            migrationBuilder.DropTable(
                name: "EnvironmentData");

            migrationBuilder.DropTable(
                name: "TrafficData");

            migrationBuilder.DropTable(
                name: "WeatherData");

            migrationBuilder.DropTable(
                name: "Devices");
        }
    }
}
