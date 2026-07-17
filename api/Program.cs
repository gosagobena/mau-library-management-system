using System.Text;
using System.Threading.RateLimiting;
using LibrarySystem.Api.Data;
using LibrarySystem.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// ── Database (EF Core + Npgsql) ──────────────────────────
builder.Services.AddDbContext<LibraryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ── Application services ─────────────────────────────────
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddHostedService<OverdueBackgroundService>();

// ── Authentication: JWT Bearer (Section 3.7) ─────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key must be configured (see .env.example).");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

// ── CORS: only allow configured origins (Section 3.7) ────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── Rate limiting on auth endpoints (Section 3.7) ────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// ── Controllers + Swagger/OpenAPI ────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MAU Library Management System API",
        Version = "v1",
        Description = "REST API for the Mattu University Main Campus Library Management System."
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your JWT access token."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<LibraryDbContext>();

var app = builder.Build();

await EnsureDatabaseAndRoleAsync(builder.Configuration);

// ── Migrate + seed on startup ────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
    await DbSeeder.SeedAsync(context, app.Configuration);
}

// ── Middleware pipeline ──────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Swagger stays available behind the reverse proxy at /api/swagger in staging;
    // remove these two lines to disable it entirely in production.
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

static async Task EnsureDatabaseAndRoleAsync(IConfiguration configuration)
{
    var connectionString = configuration.GetConnectionString("Default");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return;
    }

    var builder = new NpgsqlConnectionStringBuilder(connectionString);
    var adminUser = configuration["ConnectionStrings:AdminUser"] ?? "postgres";
    var adminPassword = configuration["ConnectionStrings:AdminPassword"] ?? string.Empty;

    try
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        return;
    }
    catch (NpgsqlException)
    {
        // Fall back to creating the current role and database if they are missing.
    }

    var adminConnectionString = new NpgsqlConnectionStringBuilder
    {
        Host = builder.Host,
        Port = builder.Port,
        Database = "postgres",
        Username = adminUser,
        Password = adminPassword,
        SslMode = builder.SslMode,
        TrustServerCertificate = builder.TrustServerCertificate
    }.ConnectionString;

    await using (var adminConnection = new NpgsqlConnection(adminConnectionString))
    {
        await adminConnection.OpenAsync();

        await using var roleCheck = adminConnection.CreateCommand();
        roleCheck.CommandText = "SELECT 1 FROM pg_roles WHERE rolname = @role";
        roleCheck.Parameters.AddWithValue("role", builder.Username);
        var roleExists = await roleCheck.ExecuteScalarAsync() is not null;

        if (!roleExists)
        {
            var escapedPassword = builder.Password.Replace("'", "''");
            await using var createRole = adminConnection.CreateCommand();
            createRole.CommandText = "CREATE ROLE " + QuoteIdentifier(builder.Username) + " LOGIN PASSWORD '" + escapedPassword + "'";
            await createRole.ExecuteNonQueryAsync();
        }

        await using var databaseCheck = adminConnection.CreateCommand();
        databaseCheck.CommandText = "SELECT 1 FROM pg_database WHERE datname = @database";
        databaseCheck.Parameters.AddWithValue("database", builder.Database);
        var databaseExists = await databaseCheck.ExecuteScalarAsync() is not null;

        if (!databaseExists)
        {
            await using var createDatabase = adminConnection.CreateCommand();
            createDatabase.CommandText = $"CREATE DATABASE {QuoteIdentifier(builder.Database)} OWNER {QuoteIdentifier(builder.Username)}";
            await createDatabase.ExecuteNonQueryAsync();
        }
    }
}

static string QuoteIdentifier(string identifier)
{
    return $"\"{identifier.Replace("\"", "\"\"")}\"";
}
