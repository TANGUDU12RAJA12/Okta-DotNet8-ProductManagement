using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProducutManagement.Data;
using ProducutManagement.Mappings;
using ProducutManagement.Repositories;
using ProducutManagement.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controller support
builder.Services.AddControllers();

// 2. Register EF Core DbContext with SQL Server for Product Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Register AutoMapper mapping profiles
builder.Services.AddAutoMapper(typeof(ProductProfile));

// 4. Register Repository Pattern Dependency Injection
builder.Services.AddScoped<IProductRepository, ProductRepository>();

// 5. Register In-Memory User Repository & JWT Token Service for Auth
builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

// 6. DUAL HYBRID JWT BEARER AUTHENTICATION (Validates Local In-Memory JWTs & Okta OIDC JWTs)
// Local JWT Configuration Settings
var jwtSettings = builder.Configuration.GetSection("Jwt");
var localSecretKey = jwtSettings["SecretKey"] ?? "SuperSecretKey_For_JWT_Authentication_DotNet8_2026_Minimum32Bytes_LongSecurityKey!";
var localIssuer = jwtSettings["Issuer"] ?? "ProducutManagementApi";
var localAudience = jwtSettings["Audience"] ?? "ProducutManagementApp";
var symmetricKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(localSecretKey));

// Okta OIDC Configuration Settings
var oktaSettings = builder.Configuration.GetSection("Okta");
var oktaAuthority = oktaSettings["Authority"] ?? "https://trial-5762069.okta.com/oauth2/default";
var oktaAudience = oktaSettings["Audience"] ?? "api://employee-management-api";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = oktaAuthority;
    options.RequireHttpsMetadata = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuers = new[] { localIssuer, oktaAuthority },

        ValidateAudience = true,
        ValidAudiences = new[] { localAudience, oktaAudience },

        ValidateLifetime = true,

        // Custom signing key resolver: dynamically returns local symmetric key for local tokens or Okta's JWKS public keys for Okta tokens
        IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
        {
            if (securityToken.Issuer == localIssuer)
            {
                return new[] { symmetricKey };
            }

            // Fallback to Okta's public keys
            return options.ConfigurationManager?.GetConfigurationAsync(CancellationToken.None).Result?.SigningKeys 
                   ?? Array.Empty<SecurityKey>();
        }
    };
});

builder.Services.AddAuthorization();

// 7. Configure CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 8. Configure Swagger / OpenAPI with JWT Bearer Security
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Product Management API with Dual Hybrid Authentication",
        Version = "v1",
        Description = "ASP.NET Core Web API supporting Local In-Memory Auth & Okta OIDC Auth"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token in format: Bearer {your token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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

var app = builder.Build();

// 9. Configure Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Product Management API v1");
    });
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
