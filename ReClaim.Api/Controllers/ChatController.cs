using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;

namespace ReClaim.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("contacts")]
        public async Task<IActionResult> GetAllowedContacts()
        {
            var myClerkId =
                User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(myClerkId))
                return BadRequest("Token ID is missing!");

            var myUser = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == myClerkId);
            if (myUser == null)
                return NotFound("User not found in database");

            var myRole = myUser.Role?.ToLower() ?? "citizen";

            var contactsQuery = _context.Users.Where(u => u.ClerkId != myClerkId);

            if (myRole == "citizen")
            {
                contactsQuery = contactsQuery.Where(u =>
                    u.Role.ToLower() == "recycler" || u.Role.ToLower() == "admin"
                );
            }
            else if (myRole == "recycler")
            {
                contactsQuery = contactsQuery.Where(u =>
                    u.Role.ToLower() == "admin" || u.Role.ToLower() == "citizen"
                );
            }

            // Subquery determines latest message for sorting
            var contacts = await contactsQuery
                .Select(u => new
                {
                    u.ClerkId,
                    Name = string.IsNullOrWhiteSpace(u.FirstName)
                        ? "Unknown"
                        : u.FirstName + " " + (u.LastName ?? ""),
                    Role = u.Role ?? "User",
                    Email = u.Email,
                    LastMessageTime = _context
                        .ChatMessages.Where(m =>
                            (m.SenderId == myClerkId && m.ReceiverId == u.ClerkId)
                            || (m.SenderId == u.ClerkId && m.ReceiverId == myClerkId)
                        )
                        .Max(m => (DateTime?)m.Timestamp)
                        ?? DateTime.MinValue, // Fallback for no messages
                })
                .OrderByDescending(c => c.LastMessageTime) // Sort by latest activity
                .Select(c => new
                {
                    c.ClerkId,
                    c.Name,
                    c.Role,
                    c.Email,
                }) // Strip time for response payload
                .ToListAsync();

            return Ok(contacts);
        }

        [HttpGet("history/{contactId}")]
        public async Task<IActionResult> GetChatHistory(string contactId)
        {
            var myClerkId =
                User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(myClerkId))
                return BadRequest("Token ID is missing!");

            var messages = await _context
                .ChatMessages.Where(m =>
                    (m.SenderId == myClerkId && m.ReceiverId == contactId)
                    || (m.SenderId == contactId && m.ReceiverId == myClerkId)
                )
                .OrderBy(m => m.Timestamp)
                .Select(m => new
                {
                    senderId = m.SenderId,
                    message = m.Message,
                    timestamp = m.Timestamp,
                    isRead = m.IsRead, // <-- NEW
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}
