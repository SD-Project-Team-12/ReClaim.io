using Microsoft.AspNetCore.Mvc;
using ReClaim.Api.Entities;
using Svix;
using System.IO;
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

        public WebhooksController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("clerk")]
        public async Task<IActionResult> ClerkWebhook()
        {
            // 1. Read the raw body and the Svix headers
            var json = await new StreamReader(Request.Body).ReadToEndAsync();
            var svixId = Request.Headers["svix-id"];
            var svixTimestamp = Request.Headers["svix-timestamp"];
            var svixSignature = Request.Headers["svix-signature"];

            if (string.IsNullOrEmpty(svixId) || string.IsNullOrEmpty(svixTimestamp) || string.IsNullOrEmpty(svixSignature))
            {
                return BadRequest("Missing Svix headers");
            }

            // 2. Verify the webhook signature securely
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

            // 3. Parse the event and save the user
            var data = JsonDocument.Parse(json);
            var eventType = data.RootElement.GetProperty("type").GetString();

            if (eventType == "user.created")
            {
                var userElement = data.RootElement.GetProperty("data");
                var email = userElement.GetProperty("email_addresses")[0].GetProperty("email_address").GetString();

                // 1. Extract the public_metadata object safely
                string role = "citizen"; // Default everyone to citizen for safety
                if (userElement.TryGetProperty("public_metadata", out var metadata))
                {
                    if (metadata.TryGetProperty("role", out var roleElement))
                    {
                        role = roleElement.GetString() ?? "citizen";
                    }
                }

                var newUser = new User
                {
                    ClerkId = userElement.GetProperty("id").GetString()!,
                    Email = email!,
                    FirstName = userElement.TryGetProperty("first_name", out var fn) ? fn.GetString() : null,
                    LastName = userElement.TryGetProperty("last_name", out var ln) ? ln.GetString() : null,

                    // 2. Save the role to your PostgreSQL database!
                    Role = role
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
            }

            // Always return a 200 OK to Clerk so they know we received it
            return Ok();
        }

        
        [HttpPost]
        public async Task<IActionResult> Receive()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var data = JsonDocument.Parse(json);
            var eventType = data.RootElement.GetProperty("type").GetString();

            if (eventType == "user.created")
            {
                var userElement = data.RootElement.GetProperty("data");
                var clerkId = userElement.GetProperty("id").GetString();
                var email = userElement.GetProperty("email_addresses")[0].GetProperty("email_address").GetString();

                // AUTO-ASSIGN: Default every new signup to "citizen"
                var newUser = new User
                {
                    ClerkId = clerkId!,
                    Email = email!,
                    Role = "citizen", // This is the automatic assignment
                    FirstName = userElement.TryGetProperty("first_name", out var f) ? f.GetString() : null,
                    LastName = userElement.TryGetProperty("last_name", out var l) ? l.GetString() : null,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Citizen auto-assigned and synced." });
            }

            return Ok();
        }
    }
}