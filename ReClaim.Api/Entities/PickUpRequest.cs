using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReClaim.Api.Entities
{
    public enum RequestStatus { Pending, Assigned, PickedUp, Completed, Cancelled }
    public enum ItemCondition { Scrap, Damaged, Working }

    public class PickUpRequest
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string CitizenId { get; set; } = null!;// ClerkId of the owner
        public string? RecyclerId { get; set; } // Assigned driver/recycler

        // --- Item Details ---
        [Required]
        public string Category { get; set; } = null!;
        public string? SubCategory { get; set; }
        public string? BrandAndModel { get; set; }
        public string? ItemDescription { get; set; }

        [Required]
        public ItemCondition Condition { get; set; }
        public bool IsPoweringOn { get; set; }
        public double WeightKg { get; set; }

        // --- Price Analysis ---
        [Column(TypeName = "decimal(18,2)")]
        public decimal EstimatedValue { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? FinalPrice { get; set; }

        // --- Logistics ---
        public string? ImageUrl { get; set; }
        [Required]
        public string PickUpAddress { get; set; } = null!;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime PreferredPickUpTime { get; set; }

        // --- Metadata ---
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}