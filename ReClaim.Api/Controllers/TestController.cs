using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ReClaim.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // <-- THIS IS THE LOCK
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetSecureData()
        {
            // If the code reaches here, the user is 100% authenticated by Clerk.
            // We can even extract their unique Clerk User ID from the token!
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Ok($"Success! The backend recognizes you. Your secure Clerk ID is: {userId}");
        }
    }
}