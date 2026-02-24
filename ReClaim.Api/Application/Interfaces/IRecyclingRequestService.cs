using ReClaim.Api.Application.DTOs;
using ReClaim.Api.Domain.Entities;

namespace ReClaim.Api.Application.Interfaces;

public interface IRecyclingRequestService
{
    Task<RecyclingRequest> CreateRequestAsync(string sellerId, CreateRecyclingRequestDto dto);
    Task<IEnumerable<RecyclingRequest>> GetNearbyRequestsAsync(double lat, double lon, double radiusKm);
}