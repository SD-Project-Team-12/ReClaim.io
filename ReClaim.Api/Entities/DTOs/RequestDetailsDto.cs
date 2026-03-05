using ReClaim.Api.Entities;

public class RequestDetailsDto
{
    // Ensure this property is named 'Request'
    public PickUpRequest Request { get; set; } = null!;
    public string ContactName { get; set; } = "Unknown User";
    public string ContactPhone { get; set; } = "No Phone Provided";
}