using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReClaim.Api.Application.DTOs;
using ReClaim.Api.Application.Interfaces;
using System.Security.Claims;

namespace ReClaim.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // শুধুমাত্র লগইন করা ইউজারদের জন্য
public class RecyclingRequestsController : ControllerBase
{
    private readonly IRecyclingRequestService _requestService;

    public RecyclingRequestsController(IRecyclingRequestService requestService)
    {
        _requestService = requestService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest([FromBody] CreateRecyclingRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // ক্লার্ক থেকে ইউজারের আইডি নেওয়া
        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized("ইউজার আইডি পাওয়া যায়নি।");

        try
        {
            var request = await _requestService.CreateRequestAsync(sellerId, dto);
            return Ok(new { Message = "রিকোয়েস্ট সফল হয়েছে", RequestId = request.Id });
        }
        catch (Exception) // 'ex' সরিয়ে দেওয়া হয়েছে কারণ এটি ব্যবহৃত হচ্ছিল না
        {
            return StatusCode(500, "রিকোয়েস্ট প্রসেস করার সময় একটি এরর হয়েছে।");
        }
    }
}