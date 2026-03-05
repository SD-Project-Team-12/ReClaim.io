namespace ReClaim.Api.Models.DTOs
{
    public class PickUpRequestDto
    {
        public string Category { get; set; } = null!;
        public string? SubCategory { get; set; }
        public string? BrandAndModel { get; set; }
        public string? ItemDescription { get; set; }
        public int Condition { get; set; } 
        public bool IsPoweringOn { get; set; }
        public double WeightKg { get; set; }
        public string PickUpAddress { get; set; } = null!;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime PreferredPickUpTime { get; set; }
        public List<string>? ImageUrls { get; set; } = new List<string>();
    }
}