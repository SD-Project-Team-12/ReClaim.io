using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;

namespace ReClaim.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // We will add a custom [Authorize(Roles = "admin")] check below
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
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
            // 1. Check the ID coming from your token
            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // 2. Lookup the user in your DB
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
                user.Role = "recycler"; // Promote to Recycler!
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User promoted to Recycler successfully." });
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
    }
}