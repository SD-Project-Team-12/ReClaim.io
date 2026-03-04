using ReClaim.Api.Application.DTOs;
using ReClaim.Api.Domain.Entities;

namespace ReClaim.Api.Application.Interfaces;

public interface IRecyclingRequestService
{
    Task<RecyclingRequest> CreateRequestAsync(string sellerId, CreateRecyclingRequestDto dto);
   
    Task<IEnumerable<RecyclingRequest>> GetAllRequestsAsync();
    Task<IEnumerable<RecyclingRequest>> GetUserRequestsAsync(string sellerId);
}