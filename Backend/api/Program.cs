using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;
using System.Security.Claims;
using Api.Middleware;
using Infrastructure;
using Infrastructure.Options;
using Microsoft.AspNetCore.Http.Features;
using Application.Common.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ====================== Kestrel Timeouts ======================
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

// ====================== Controllers + JSON ======================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ====================== Upload Size Limits ======================
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024;
});
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 50 * 1024 * 1024;
});

// ====================== Swagger (dev uniquement) ======================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API RAG Interne",
        Version = "v1",
        Description = "Chatbot RAG avec Clean Architecture + CQRS + PostgreSQL + pgvector"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: 'Bearer {token}'",
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

// ====================== Bind JwtOptions ======================
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("JwtOptions"));

// ====================== JWT Authentication ======================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtOptions = builder.Configuration.GetSection("JwtOptions");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions["Issuer"],
            ValidAudience = jwtOptions["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions["SecretKey"]!)),
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            }
        };
    });

// ====================== Authorization Policies ======================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanManageDocuments", policy =>
        policy.RequireRole("Admin", "Manager"));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
});

// ====================== HttpContextAccessor ======================
builder.Services.AddHttpContextAccessor();

// ====================== Infrastructure ======================
builder.Services.AddInfrastructure(builder.Configuration);

// ====================== Lier les interfaces aux DbContexts concrets ======================
builder.Services.AddScoped<ISqlServerDbContext>(sp =>
    sp.GetRequiredService<Infrastructure.Persistence.Auth.SqlServerDbContext>());

builder.Services.AddScoped<IVectorDbContext>(sp =>
    sp.GetRequiredService<Infrastructure.Persistence.RAG.VectorDbContext>());

// ====================== CORS ======================
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

// ====================== Middleware Pipeline ======================

// ✅ Swagger uniquement en développement
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API RAG v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();