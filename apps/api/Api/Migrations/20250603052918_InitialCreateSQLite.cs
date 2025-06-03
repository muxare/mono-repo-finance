using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exchanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Country = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Timezone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exchanges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Sectors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sectors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Stocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Symbol = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    SectorId = table.Column<int>(type: "INTEGER", nullable: false),
                    ExchangeId = table.Column<int>(type: "INTEGER", nullable: false),
                    MarketCap = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    OutstandingShares = table.Column<long>(type: "INTEGER", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stocks_Exchanges_ExchangeId",
                        column: x => x.ExchangeId,
                        principalTable: "Exchanges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Stocks_Sectors_SectorId",
                        column: x => x.SectorId,
                        principalTable: "Sectors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockPrices",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StockId = table.Column<int>(type: "INTEGER", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    Open = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    High = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Low = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Close = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Volume = table.Column<long>(type: "INTEGER", nullable: false),
                    AdjustedClose = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockPrices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockPrices_Stocks_StockId",
                        column: x => x.StockId,
                        principalTable: "Stocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exchange_Code",
                table: "Exchanges",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exchange_Name",
                table: "Exchanges",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Sector_Name",
                table: "Sectors",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockPrice_Date",
                table: "StockPrices",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_StockPrice_StockId_Date_OHLCV",
                table: "StockPrices",
                columns: new[] { "StockId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stock_ExchangeId",
                table: "Stocks",
                column: "ExchangeId");

            migrationBuilder.CreateIndex(
                name: "IX_Stock_IsActive",
                table: "Stocks",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Stock_SectorId",
                table: "Stocks",
                column: "SectorId");

            migrationBuilder.CreateIndex(
                name: "IX_Stock_Symbol",
                table: "Stocks",
                column: "Symbol");

            migrationBuilder.CreateIndex(
                name: "IX_Stock_Symbol_Exchange",
                table: "Stocks",
                columns: new[] { "Symbol", "ExchangeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StockPrices");

            migrationBuilder.DropTable(
                name: "Stocks");

            migrationBuilder.DropTable(
                name: "Exchanges");

            migrationBuilder.DropTable(
                name: "Sectors");
        }
    }
}
