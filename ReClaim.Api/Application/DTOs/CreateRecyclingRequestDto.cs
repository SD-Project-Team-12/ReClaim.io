using System.ComponentModel.DataAnnotations;
using ReClaim.Api.Domain.Enums;

namespace ReClaim.Api.Application.DTOs;

public class CreateRecyclingRequestDto
{
    [Required]
    [Range(-90, 90, ErrorMessage = "Invalid Latitude")]
    public double Latitude { get; set; }

    [Required]
    [Range(-180, 180, ErrorMessage = "Invalid Longitude")]
    public double Longitude { get; set; }

    [Required(ErrorMessage = "Address details are required.")]
    [MaxLength(250)]
    public string AddressDetails { get; set; } = string.Empty;

    [Required]
    [MinLength(1, ErrorMessage = "At least one item must be included.")]
    public List<RequestItemDto> Items { get; set; } = new();
}

public class RequestItemDto
{
    [Required]
    public WasteType Type { get; set; }

    [Range(0.1, 1000, ErrorMessage = "Weight must be between 0.1 and 1000 kg")]
    public decimal EstimatedWeightKg { get; set; }

    [Url(ErrorMessage = "Invalid URL format for photo")]
    public string? PhotoUrl { get; set; }
    
    [Range(0, 100000)]
    public decimal PredictedValue { get; set; }
}