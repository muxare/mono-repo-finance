# Finance Screener API

## Database Setup

This project uses SQLite as the database. The database files are **not** committed to version control.

### First Time Setup

1. **Run Entity Framework Migrations:**
   ```bash
   dotnet ef database update
   ```

2. **Seed Initial Data (if needed):**
   ```bash
   # Run the application - it will create the database automatically
   dotnet run
   ```

### Database Files (Local Development)

The following files are created locally and should **NOT** be committed:
- `FinanceScreener.db` - Main SQLite database file
- `FinanceScreener.db-shm` - SQLite shared memory file
- `FinanceScreener.db-wal` - SQLite write-ahead log file
- `Data Source=*` - Connection string related files

These files are automatically excluded via `.gitignore`.

### Migration Commands

```bash
# Create a new migration
dotnet ef migrations add <MigrationName>

# Update database to latest migration
dotnet ef database update

# Rollback to specific migration
dotnet ef database update <MigrationName>
```

## Development

```bash
# Run the API
dotnet run

# Build the project
dotnet build

# Run tests
dotnet test
```
