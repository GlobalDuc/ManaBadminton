using System.Text;
using BadmintonHub.Api.Middleware;
using BadmintonHub.Application.Interfaces;
using BadmintonHub.Application.Validators;
using BadmintonHub.Infrastructure.Persistence;
using BadmintonHub.Infrastructure.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration (SQL Server 2016 Compatibility Level 130)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=BadmintonHubDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True";

builder.Services.AddDbContext<BadmintonHubDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.UseCompatibilityLevel(130); // SQL Server 2016 compatibility level (prevents OPENJSON WITH tricks / 2019+ syntax)
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
    });
});

// 2. Application Services & Validators
builder.Services.AddScoped<IBadmintonHubService, BadmintonHubService>();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// 3. Authentication & Role-Based Authorization
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BadmintonHub_SuperSecretKey_2026_SqlServer2016_Enterprise!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BadmintonHub.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BadmintonHub.Client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// 4. CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("BadmintonHubCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 5. Controllers, HealthChecks, Swagger/OpenAPI
builder.Services.AddControllers();
builder.Services.AddHealthChecks()
    .AddDbContextCheck<BadmintonHubDbContext>("sqlserver-2016-check");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Badminton Hub Enterprise API (SQL Server 2016)",
        Version = "v1",
        Description = "API quản lý CLB Cầu Lông chuyên nghiệp (.NET 8 + EF Core 8 + SQL Server 2016 Compatibility Level 130)"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập JWT token theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 6. Auto-migrate & seed SQL Server 2016 database on startup (when running relational DB)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BadmintonHubDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        if (db.Database.IsRelational())
        {
            await db.Database.MigrateAsync();
            // Ensure database compatibility level is 130 (SQL Server 2016)
            await db.Database.ExecuteSqlRawAsync("ALTER DATABASE CURRENT SET COMPATIBILITY_LEVEL = 130;");
        }
        else
        {
            await db.Database.EnsureCreatedAsync();
        }
        await DatabaseSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database initialization error.");
    }
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Badminton Hub API v1");
});

app.UseCors("BadmintonHubCors");
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();

public partial class Program { }
