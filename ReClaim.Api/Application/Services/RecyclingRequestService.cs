using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using ReClaim.Api.Application.DTOs;
using ReClaim.Api.Application.Interfaces;
using ReClaim.Api.Domain.Entities;
using ReClaim.Api.Domain.Enums;
using ReClaim.Api;

namespace ReClaim.Api.Application.Services;

public class RecyclingRequestService : IRecyclingRequestService
{
    private readonly ApplicationDbContext _context;

    public RecyclingRequestService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RecyclingRequest> CreateRequestAsync(string sellerId, CreateRecyclingRequestDto dto)
    {
        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        var location = geometryFactory.CreatePoint(new Coordinate(dto.Longitude, dto.Latitude));

        var request = new RecyclingRequest
        {
            SellerId = sellerId,
            PickupLocation = location,
            AddressDetails = dto.AddressDetails,
            Status = RequestStatus.Pending,
            Items = dto.Items.Select(i => new RequestItem
            {
                Type = (ReClaim.Api.Domain.Enums.WasteType)i.Type,
                EstimatedWeightKg = i.EstimatedWeightKg,
                PredictedValue = i.PredictedValue
            }).ToList()
        };

        _context.RecyclingRequests.Add(request);
        await _context.SaveChangesAsync();
        return request;
    }

    
    public async Task<IEnumerable<RecyclingRequest>> GetAllRequestsAsync()
    {
        return await _context.RecyclingRequests
            .Include(r => r.Items)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

 
    public async Task<IEnumerable<RecyclingRequest>> GetUserRequestsAsync(string sellerId)
    {
        return await _context.RecyclingRequests
            .Include(r => r.Items)
            .Where(r => r.SellerId == sellerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }
}