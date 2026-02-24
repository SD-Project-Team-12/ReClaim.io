using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using ReClaim.Api.Application.DTOs;
using ReClaim.Api.Application.Interfaces;
using ReClaim.Api.Domain.Entities;
using ReClaim.Api.Domain.Enums; 

namespace ReClaim.Api.Application.Services;

public class RecyclingRequestService : IRecyclingRequestService
{
    private readonly ApplicationDbContext _context; 
    private readonly GeometryFactory _geometryFactory;

    public RecyclingRequestService(ApplicationDbContext context)
    {
        _context = context;
        // SRID 4326 is standard WGS84 (GPS)
        _geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    }

    public async Task<RecyclingRequest> CreateRequestAsync(string sellerId, CreateRecyclingRequestDto dto)
    {
        var location = _geometryFactory.CreatePoint(new Coordinate(dto.Longitude, dto.Latitude));

        var request = new RecyclingRequest
        {
            SellerId = sellerId,
            PickupLocation = location,
            AddressDetails = dto.AddressDetails,
            Items = dto.Items.Select(i => new RequestItem
            {
                Type = i.Type,
                EstimatedWeightKg = i.EstimatedWeightKg,
                PhotoUrl = i.PhotoUrl,
                PredictedValue = i.PredictedValue
            }).ToList()
        };

        await _context.Set<RecyclingRequest>().AddAsync(request);
        await _context.SaveChangesAsync();

        return request;
    }

    public async Task<IEnumerable<RecyclingRequest>> GetNearbyRequestsAsync(double lat, double lon, double radiusKm)
    {
        var location = _geometryFactory.CreatePoint(new Coordinate(lon, lat));
        var radiusInMeters = radiusKm * 1000;

        // এখানে ToListAsync() এবং RequestStatus.Pending ফিক্স করা হয়েছে
        return await _context.Set<RecyclingRequest>()
            .Where(r => r.Status == RequestStatus.Pending && r.PickupLocation.Distance(location) <= radiusInMeters)
            .ToListAsync();
    }
}