using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReClaim.Api;
using ReClaim.Api.Application.Interfaces;
using ReClaim.Api.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, x => x.UseNetTopologySuite()));

// 3. Dependency Injection
builder.Services.AddScoped<IRecyclingRequestService, RecyclingRequestService>();

// 4. Configure Clerk JWT Authentication
var clerkAuthority = "https://excited-hen-16.clerk.accounts.dev"; 

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = clerkAuthority;
        
        
        options.MetadataAddress = $"{clerkAuthority}/.well-known/openid-configuration";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, 
            ValidIssuers = new[] { clerkAuthority, $"{clerkAuthority}/" },
            ValidateAudience = false, 
            ValidateLifetime = true
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"\n[AUTH ERROR]: {context.Exception.Message}\n");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("\n[AUTH SUCCESS]: Token is valid!\n");
                return Task.CompletedTask;
            }
        };
    });

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { Error = "Server Error" });
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp"); 

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.Run();