using Microsoft.AspNetCore.Mvc;
using ReClaim.Api.Entities;
using Svix;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ReClaim.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebhooksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public WebhooksController(AppDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("clerk")]
        public async Task<IActionResult> ClerkWebhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();
            var svixId = Request.Headers["svix-id"];
            var svixTimestamp = Request.Headers["svix-timestamp"];
            var svixSignature = Request.Headers["svix-signature"];

            if (string.IsNullOrEmpty(svixId) || string.IsNullOrEmpty(svixTimestamp) || string.IsNullOrEmpty(svixSignature))
            {
                return BadRequest("Missing Svix headers");
            }

            var webhookSecret = _config["Clerk:WebhookSecret"];
            if (string.IsNullOrEmpty(webhookSecret))
            {
                return StatusCode(500, "Webhook secret not configured.");
            }

            var wh = new Webhook(webhookSecret);
            try
            {
                wh.Verify(json, new System.Net.WebHeaderCollection
                {
                    { "svix-id", svixId },
                    { "svix-timestamp", svixTimestamp },
                    { "svix-signature", svixSignature }
                });
            }
            catch (Svix.Exceptions.WebhookVerificationException)
            {
                return BadRequest("Invalid webhook signature");
            }

            var data = JsonDocument.Parse(json);
            var eventType = data.RootElement.GetProperty("type").GetString();

            if (eventType == "user.created")
            {
                var userElement = data.RootElement.GetProperty("data");
                var clerkId = userElement.GetProperty("id").GetString()!;
                var email = userElement.GetProperty("email_addresses")[0].GetProperty("email_address").GetString();

                string role = "citizen";

                var newUser = new User
                {
                    ClerkId = clerkId,
                    Email = email!,
                    FirstName = userElement.TryGetProperty("first_name", out var fn) ? fn.GetString() : null,
                    LastName = userElement.TryGetProperty("last_name", out var ln) ? ln.GetString() : null,
                    Role = role,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                await UpdateClerkUserMetadata(clerkId, role);
            }

            return Ok();
        }

private async Task UpdateClerkUserMetadata(string clerkUserId, string role)
{
    var clerkSecretKey = _config["Clerk:SecretKey"];
    
    if (string.IsNullOrEmpty(clerkSecretKey))
    {
        Console.WriteLine("[ERROR] Clerk SecretKey not found. Check User Secrets.");
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
        Console.WriteLine($"[SUCCESS] Clerk metadata updated for {clerkUserId} with role: {role}");
    }
    else
    {
        var error = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"[FAILED] Clerk API Error: {error}");
    }
}
    }
}