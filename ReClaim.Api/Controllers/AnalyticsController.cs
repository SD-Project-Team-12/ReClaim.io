using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;
using System.Security.Claims;

namespace ReClaim.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("user-stats")]
        public async Task<IActionResult> GetUserStats()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var userRequests = await _context.PickUpRequests
                .Where(r => (r.CitizenId == userId || r.RecyclerId == userId) && r.Status == RequestStatus.Completed)
                .ToListAsync();

            var totalWeight = userRequests.Sum(r => r.WeightKg);
            var totalEarnings = userRequests.Sum(r => r.EstimatedValue);

            var monthlyData = userRequests
                .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
                .Select(g => new
                {
                    Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                    Weight = g.Sum(r => r.WeightKg),
                    Earnings = g.Sum(r => r.EstimatedValue)
                })
                .OrderBy(x => x.Month) 
                .ToList();

            return Ok(new
            {
                TotalWeight = totalWeight,
                TotalEarnings = totalEarnings,
                GraphData = monthlyData
            });
        }
    }
}