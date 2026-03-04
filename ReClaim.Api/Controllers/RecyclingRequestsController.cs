using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReClaim.Api.Application.DTOs;
using ReClaim.Api.Application.Interfaces;
using System.Security.Claims;

namespace ReClaim.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] 
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

        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized("User ID not found.");

        try
        {
            var request = await _requestService.CreateRequestAsync(sellerId, dto);
            return Ok(new { Message = "Request created successfully", RequestId = request.Id });
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while processing the request.");
        }
    }

    
    [HttpGet("all")]
    [AllowAnonymous] 
    public async Task<IActionResult> GetAllRequests()
    {
        var requests = await _requestService.GetAllRequestsAsync();
        
        var response = requests.Select(r => new {
            r.Id,
            r.SellerId,
            r.Status,
            r.CreatedAt,
            Latitude = r.PickupLocation?.Y,
            Longitude = r.PickupLocation?.X,
            r.AddressDetails,
            Items = r.Items.Select(i => new { i.Id, i.Type, i.EstimatedWeightKg, i.PredictedValue })
        });
        
        return Ok(response);
    }

    
    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyRequests()
    {
        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized();

        var requests = await _requestService.GetUserRequestsAsync(sellerId);
        
        var response = requests.Select(r => new {
            r.Id,
            r.SellerId,
            r.Status,
            r.CreatedAt,
            Latitude = r.PickupLocation?.Y,
            Longitude = r.PickupLocation?.X,
            r.AddressDetails,
            Items = r.Items.Select(i => new { i.Id, i.Type, i.EstimatedWeightKg, i.PredictedValue })
        });
        
        return Ok(response);
    }
}