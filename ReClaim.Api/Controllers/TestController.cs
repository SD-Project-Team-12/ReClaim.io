using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ReClaim.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        // 1. Anyone logged in can access this (Citizens, Recyclers, Admins)
        [Authorize]
        [HttpGet("citizen")]
        public IActionResult GetCitizenData()
        {
            // Grab every single claim (piece of data) .NET sees in your token
            var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

            return Ok(new
            {
                Message = "Hello Citizen! Here is what .NET sees in your token:",
                Claims = allClaims
            });
        }

        // 2. ONLY Admins can access this!
        [Authorize(Roles = "admin")]
        [HttpGet("admin")]
        public IActionResult GetAdminData()
        {
            return Ok(new { Message = "Hello Admin! You have top-secret access." });
        }
    }
}