using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReClaim.Api.Entities;
using ReClaim.Api.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Models.DTOs;

namespace ReClaim.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Protected by Clerk JWT
    public class PickUpController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPriceEstimationService _priceService;

        public PickUpController(AppDbContext context, IPriceEstimationService priceService)
        {
            _context = context;
            _priceService = priceService;
        }

        [HttpPost("submit")]
        public async Task<IActionResult> CreateRequest([FromBody] PickUpRequestDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var request = new PickUpRequest
            {
                Id = Guid.NewGuid(),
                CitizenId = userId,
                Category = dto.Category,
                SubCategory = dto.SubCategory ?? "General",
                BrandAndModel = dto.BrandAndModel,
                ItemDescription = dto.ItemDescription,
                Condition = (ItemCondition)dto.Condition,
                IsPoweringOn = dto.IsPoweringOn,
                WeightKg = dto.WeightKg,
                PickUpAddress = dto.PickUpAddress,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,

                // --- THE FIX IS HERE ---
                // We must specify that this time is UTC for PostgreSQL
                PreferredPickUpTime = DateTime.SpecifyKind(dto.PreferredPickUpTime, DateTimeKind.Utc),

                Status = RequestStatus.Pending,
                CreatedAt = DateTime.UtcNow // This is already UTC
            };

            // Calculate price logic...
            request.EstimatedValue = _priceService.GetEstimate(
                dto.Category,
                ((ItemCondition)dto.Condition).ToString(),
                dto.WeightKg,
                dto.IsPoweringOn
            );

            _context.PickUpRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { Estimate = request.EstimatedValue, RequestId = request.Id });
        }

        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            // 1. Get the authenticated User's ID from Clerk
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // 2. Fetch only THIS user's requests from the database
            var requests = await _context.PickUpRequests
                .Where(r => r.CitizenId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(requests);
        }

        // 1. GET ALL PENDING PINS FOR THE FLEET MAP
        [HttpGet("pending")]
        [Authorize] // You can restrict this to Recyclers/Admins later!
        public async Task<IActionResult> GetPendingRequests()
        {
            // Status 0 means it is Pending and awaiting a driver
            var pendingRequests = await _context.PickUpRequests
                .Where(req => req.Status == 0)
                .OrderBy(req => req.CreatedAt)
                .ToListAsync();

            return Ok(pendingRequests);
        }

        // 2. ALLOW A DRIVER TO CLAIM A PIN
        [HttpPut("{id}/claim")]
        [Authorize]
        public async Task<IActionResult> ClaimRequest(Guid id)
        {
            var request = await _context.PickUpRequests.FindAsync(id);
            if (request == null) return NotFound("Request not found.");
            
            // Prevent two drivers from claiming the same request at the exact same time
            if (request.Status != 0) return BadRequest("This request has already been claimed.");

            // Get the current Recycler's ID from the JWT token
            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var recycler = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);

            if (recycler == null) return Unauthorized();

            // Update the status to Assigned (1)
            request.Status = (RequestStatus)1;
            
            // If your PickUpRequest entity has a RecyclerId, uncomment this line!
            // request.RecyclerId = recycler.Id; 

            await _context.SaveChangesAsync();

            return Ok(new { message = "Extraction assigned successfully." });
        }
    }
}