using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;
using System.Text.Json;
using System.Text;
using System.Net.Http;

namespace ReClaim.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // We will add a custom [Authorize(Roles = "admin")] check below
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        public AdminController(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        // Helper to check if the current user is an admin in our database
        private async Task<bool> IsAdmin()
        {
            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);
            return user?.Role?.ToLower() == "admin";
        }

        [HttpGet("diagnose")]
        public async Task<IActionResult> Diagnose()
        {
            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);

            return Ok(new
            {
                TokenClerkId = clerkId,
                DbUserFound = userInDb != null,
                DbUserRole = userInDb?.Role ?? "User Record Not Found",
                MatchesAdmin = userInDb?.Role?.ToLower() == "admin"
            });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            if (!await IsAdmin()) return Forbid();

            var totalWeight = await _context.PickUpRequests.SumAsync(r => r.WeightKg);
            var totalPayout = await _context.PickUpRequests.SumAsync(r => r.EstimatedValue);
            var totalUsers = await _context.Users.CountAsync();
            var pendingRequests = await _context.PickUpRequests.CountAsync(r => r.Status == 0);

            return Ok(new
            {
                TotalWeightKg = totalWeight,
                TotalPayout = totalPayout,
                UserCount = totalUsers,
                ActiveRequests = pendingRequests
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            if (!await IsAdmin()) return Forbid();

            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("all-requests")]
        public async Task<IActionResult> GetAllRequests()
        {
            if (!await IsAdmin()) return Forbid();

            var requests = await _context.PickUpRequests
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(requests);
        }
        
        [HttpGet("pending-applications")]
        public async Task<IActionResult> GetPendingApplications()
        {
            if (!await IsAdmin()) return Forbid();
            return Ok(await _context.RecyclerApplications.Where(a => a.Status == "Pending").ToListAsync());
        }

        [HttpPost("approve-recycler/{applicationId}")]
        public async Task<IActionResult> ApproveRecycler(Guid applicationId)
        {
            if (!await IsAdmin()) return Forbid();

            var app = await _context.RecyclerApplications.FindAsync(applicationId);
            if (app == null) return NotFound();

            // 1. Mark application as Approved
            app.Status = "Approved";

            // 2. Locate the user and promote them
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == app.ClerkId);
            if (user != null)
            {
                user.Role = "recycler"; // Promote to Recycler in DB!
                
                await UpdateClerkUserMetadata(user.ClerkId, "recycler");
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User promoted to Recycler successfully and Clerk Metadata updated." });
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyForRecycler([FromBody] RecyclerApplication application)
        {
            if (application == null) return BadRequest("Invalid application data.");

            // Set default values before saving
            application.Id = Guid.NewGuid();
            application.Status = "Pending";
            application.SubmittedAt = DateTime.UtcNow;

            _context.RecyclerApplications.Add(application);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Application submitted successfully!" });
        }

        private async Task UpdateClerkUserMetadata(string clerkUserId, string role)
        {
            var clerkSecretKey = _config["Clerk:SecretKey"];
            
            if (string.IsNullOrEmpty(clerkSecretKey))
            {
                Console.WriteLine("[ERROR] Clerk SecretKey missing.");
                return;
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", clerkSecretKey);

            var url = $"https://api.clerk.com/v1/users/{clerkUserId}/metadata";

            var metadataUpdate = new
            {
                public_metadata = new { role = role }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(metadataUpdate), 
                Encoding.UTF8, 
                "application/json"
            );

            var response = await client.PatchAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[SUCCESS] Promoted {clerkUserId} to {role} in Clerk.");
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[FAILED] Clerk API Error: {error}");
            }
        }
    }
}