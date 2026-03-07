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
    [Authorize] 
    public class PickUpController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPriceEstimationService _priceService;
        private readonly ILogger<PickUpController> _logger;

        public PickUpController(AppDbContext context, IPriceEstimationService priceService, ILogger<PickUpController> logger)
        {
            _context = context;
            _priceService = priceService;
            _logger = logger;
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

                ImageUrls = dto.ImageUrls,
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

        // GET ALL PENDING ITEMS FOR MARKETPLACE WITH PAGINATION
        [HttpGet("marketplace")]
        [Authorize]
        public async Task<IActionResult> GetMarketplaceItems([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            var totalItems = await _context.PickUpRequests
                .CountAsync(req => req.Status == RequestStatus.Pending);

            var itemsQuery = from req in _context.PickUpRequests
                             where req.Status == RequestStatus.Pending
                             join u in _context.Users on req.CitizenId equals u.ClerkId into userGroup
                             from user in userGroup.DefaultIfEmpty() // Left Join
                             orderby req.CreatedAt descending
                             select new
                             {
                                 req.Id,
                                 req.Category,
                                 req.SubCategory,
                                 req.BrandAndModel,
                                 req.ItemDescription,
                                 req.Condition,
                                 req.IsPoweringOn,
                                 req.WeightKg,
                                 req.PickUpAddress,
                                 req.Latitude,
                                 req.Longitude,
                                 req.ImageUrls,
                                 req.PreferredPickUpTime,
                                 req.Status,
                                 req.CreatedAt,
                                 req.EstimatedValue,
                                 req.CitizenId,

                                 ClerkId = req.CitizenId,
                                 UserDisplayName = user != null && !string.IsNullOrWhiteSpace(user.FirstName)
                                     ? (user.FirstName + " " + (user.LastName ?? "")).Trim()
                                     : "Seller"
                             };

            var items = await itemsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            return Ok(new
            {
                items = items,
                totalPages = totalPages,
                currentPage = page,
                totalItems = totalItems
            });
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
            if (request.Status != 0) return BadRequest("This request has already been claimed.");

            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (clerkId == null) return Unauthorized();

            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);
            if (currentUser == null) return NotFound("User not found in database.");

            var userRole = currentUser.Role?.ToLower() ?? "citizen";

            if (userRole != "recycler" && userRole != "admin")
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Access Denied: Only recyclers or admins can assign routes." });
            }

            request.Status = (RequestStatus)1;
            request.RecyclerId = clerkId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Extraction assigned successfully." });
        }

        // FETCH DRIVER'S ACTIVE MISSIONS
        [HttpGet("my-assignments")]
        [Authorize]
        public async Task<IActionResult> GetMyAssignments()
        {
            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (clerkId == null) return Unauthorized();

            var assignments = await _context.PickUpRequests
                .Where(r => r.RecyclerId == clerkId && r.Status >= (RequestStatus)1 && r.Status <= (RequestStatus)3)
                .OrderByDescending(r => r.CreatedAt) 
                .ToListAsync();

            return Ok(assignments);
        }

        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateRequestStatus(Guid id, [FromBody] int newStatus)
        {
            var clerkId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var request = await _context.PickUpRequests.FindAsync(id);

            if (request == null) return NotFound();

            // Security Check: Only the assigned driver can update this
            if (request.RecyclerId != clerkId) return Forbid();

            request.Status = (RequestStatus)newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(Guid id)
        {
            var request = await _context.PickUpRequests.FindAsync(id);

            if (request == null)
                return NotFound(new { message = "Request not found" });

            // Business Logic: Only allow deletion if the driver hasn't claimed it yet
            if (request.Status != Entities.RequestStatus.Pending)
                return BadRequest(new { message = "Cannot delete a request that is already assigned or completed." });

            _context.PickUpRequests.Remove(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Deployment deleted successfully." });
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetRequestById(Guid id, [FromServices] IHttpClientFactory clientFactory, [FromServices] IConfiguration config)
        {
            var request = await _context.PickUpRequests.FindAsync(id);
            if (request == null) return NotFound();

            var dto = new RequestDetailsDto
            {
                Request = request,
                ContactName = "Citizen Profile",
                ContactPhone = "Contact Unavailable"
            };

            try
            {
                var clerkSecretKey = config["Clerk:SecretKey"];
                if (string.IsNullOrEmpty(clerkSecretKey))
                {
                    _logger.LogWarning("Clerk Secret Key is missing from secrets!");
                }
                else
                {
                    var client = clientFactory.CreateClient();
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", clerkSecretKey);

                    var response = await client.GetAsync($"https://api.clerk.com/v1/users/{request.CitizenId}");

                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = System.Text.Json.JsonDocument.Parse(content);
                        var root = doc.RootElement;

                        // Safely extract name with null checks to stop warnings
                        string firstName = root.TryGetProperty("first_name", out var fn) ? fn.GetString() ?? "" : "";
                        string lastName = root.TryGetProperty("last_name", out var ln) ? ln.GetString() ?? "" : "";
                        dto.ContactName = $"{firstName} {lastName}".Trim();

                        if (string.IsNullOrEmpty(dto.ContactName)) dto.ContactName = "Anonymous Citizen";

                        // Safely extract first phone number
                        if (root.TryGetProperty("phone_numbers", out var phones) && phones.GetArrayLength() > 0)
                        {
                            dto.ContactPhone = phones[0].GetProperty("phone_number").GetString() ?? "No Phone Provided";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Clerk Enrichment Failed for request {RequestId}", id);
            }

            return Ok(dto);
        }
    }
}