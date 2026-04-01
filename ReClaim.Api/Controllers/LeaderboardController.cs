using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;
using System.Security.Claims;

namespace ReClaim.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LeaderboardController> _logger;

        public LeaderboardController(AppDbContext context, ILogger<LeaderboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetLeaderboard()
        {
            try
            {
                // 1. Get Citizen Stats
                var citizenStats = await _context.PickUpRequests
                    .Where(r => (int)r.Status == 3)
                    .GroupBy(r => r.CitizenId)
                    .Select(g => new { ClerkId = g.Key, Weight = g.Sum(x => x.WeightKg), Value = g.Sum(x => x.EstimatedValue) })
                    .ToListAsync();

                // 2. Get Recycler Stats
                var recyclerStats = await _context.PickUpRequests
                    .Where(r => (int)r.Status == 3 && r.RecyclerId != null)
                    .GroupBy(r => r.RecyclerId!)
                    .Select(g => new { ClerkId = g.Key, Weight = g.Sum(x => x.WeightKg), Value = g.Sum(x => x.EstimatedValue) })
                    .ToListAsync();

                // 3. Combine and Aggregate in memory
                var combinedStats = citizenStats.Concat(recyclerStats)
                    .GroupBy(x => x.ClerkId)
                    .Select(g => new
                    {
                        ClerkId = g.Key,
                        TotalWeight = g.Sum(x => x.Weight),
                        TotalValue = g.Sum(x => x.Value),
                        Points = (g.Sum(x => x.Weight) * 50) + ((double)g.Sum(x => x.Value) * 0.1)
                    })
                    .OrderByDescending(x => x.Points)
                    .Take(100)
                    .ToList();

                // 4. Fetch User Details (Names & Roles)
                var clerkIds = combinedStats.Select(s => s.ClerkId).ToList();
                var users = await _context.Users
                    .Where(u => clerkIds.Contains(u.ClerkId))
                    .ToDictionaryAsync(u => u.ClerkId, u => new { Name = $"{u.FirstName} {u.LastName}".Trim(), Role = u.Role });

                var leaderboard = combinedStats.Select((s, index) => new
                {
                    Rank = index + 1,
                    Name = users.ContainsKey(s.ClerkId) && !string.IsNullOrWhiteSpace(users[s.ClerkId].Name) 
                            ? users[s.ClerkId].Name 
                            : "Eco Hero",
                    Role = users.ContainsKey(s.ClerkId) ? users[s.ClerkId].Role : "citizen",
                    Points = Math.Round(s.Points, 0),
                    TotalWeight = Math.Round(s.TotalWeight, 2),
                    TotalValue = s.TotalValue
                }).ToList();

                return Ok(leaderboard);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate leaderboard.");
                return StatusCode(500, "Internal server error.");
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyRank()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var citizenStats = await _context.PickUpRequests
                    .Where(r => (int)r.Status == 3)
                    .GroupBy(r => r.CitizenId)
                    .Select(g => new { ClerkId = g.Key, Weight = g.Sum(x => x.WeightKg), Value = g.Sum(x => x.EstimatedValue) })
                    .ToListAsync();

                var recyclerStats = await _context.PickUpRequests
                    .Where(r => (int)r.Status == 3 && r.RecyclerId != null)
                    .GroupBy(r => r.RecyclerId!)
                    .Select(g => new { ClerkId = g.Key, Weight = g.Sum(x => x.WeightKg), Value = g.Sum(x => x.EstimatedValue) })
                    .ToListAsync();

                var combinedStats = citizenStats.Concat(recyclerStats)
                    .GroupBy(x => x.ClerkId)
                    .Select(g => new
                    {
                        ClerkId = g.Key,
                        Points = (g.Sum(x => x.Weight) * 50) + ((double)g.Sum(x => x.Value) * 0.1)
                    })
                    .OrderByDescending(x => x.Points)
                    .ToList();

                var myStat = combinedStats
                    .Select((s, index) => new { s.ClerkId, s.Points, Rank = index + 1 })
                    .FirstOrDefault(s => s.ClerkId == userId);

                if (myStat == null)
                {
                    return Ok(new { Rank = "-", Points = 0, HasCompletedPickups = false });
                }

                return Ok(new { 
                    Rank = myStat.Rank, 
                    Points = Math.Round(myStat.Points, 0), 
                    HasCompletedPickups = true 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch user rank.");
                return StatusCode(500, "Internal server error.");
            }
        }
    }
}