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
        private readonly ApplicationDbContext _context;
        private readonly IPriceEstimationService _priceService;

        public PickUpController(ApplicationDbContext context, IPriceEstimationService priceService)
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
    }
}