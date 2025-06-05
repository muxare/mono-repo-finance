using Api.Data;
using Api.Services;
using Api.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Finance Screener API",
        Version = "v1",
        Description = "RESTful API for financial data and stock market information. Provides endpoints for stock data, price history, sectors, and exchanges.",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Finance Screener Team",
            Email = "support@financescreener.com"
        }
    });
    
    // Include XML comments for better documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
    
    // Add example schemas
    options.DescribeAllParametersInCamelCase();
});

// Add Entity Framework
builder.Services.AddDbContext<FinanceDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Server=(localdb)\\mssqllocaldb;Database=FinanceScreenerDb;Trusted_Connection=true;MultipleActiveResultSets=true";
    
    if (builder.Environment.IsDevelopment())
    {
        // Use SQLite for development
        options.UseSqlite(connectionString);
    }
    else
    {
        // Use SQL Server for production
        options.UseSqlServer(connectionString);
    }
});

// Add application services
builder.Services.AddScoped<IDataSeedService, DataSeedService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IStockPriceService, StockPriceService>();
builder.Services.AddScoped<ISectorService, SectorService>();
builder.Services.AddScoped<IExchangeService, ExchangeService>();

// Add CORS policy for the frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => 
        {
            if (string.IsNullOrEmpty(origin)) return false;
            
            // Allow any localhost origin during development
            var uri = new Uri(origin);
            return uri.Host == "localhost" || uri.Host == "127.0.0.1";
        })
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Run database migrations and seeding in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    var seedService = scope.ServiceProvider.GetRequiredService<IDataSeedService>();
    
    try
    {
        await context.Database.MigrateAsync();
        await seedService.SeedAsync();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database");
    }
}

// Configure the HTTP request pipeline.

// Add global exception handling middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Finance Screener API V1");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "Finance Screener API Documentation";
        options.DisplayRequestDuration();
    });
}

// Enable CORS
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
