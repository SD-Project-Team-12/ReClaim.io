using NetTopologySuite.Geometries;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReClaim.Api.Domain.Enums;

namespace ReClaim.Api.Domain.Entities;

[Table("tbl_recycling_requests")]
public class RecyclingRequest
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("seller_id")]
    [MaxLength(100)]
    public string SellerId { get; set; } = string.Empty; // Clerk User ID

    [Column("recycler_id")]
    [MaxLength(100)]
    public string? RecyclerId { get; set; } // Null until a recycler accepts it

    [Column("status")]
    public RequestStatus Status { get; set; } = RequestStatus.Pending;

    [Required]
    [Column("pickup_location", TypeName = "geometry(Point, 4326)")]
    public Point PickupLocation { get; set; } = null!;

    [Required]
    [Column("address_details")]
    [MaxLength(250)]
    public string AddressDetails { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation property for 1-to-Many relationship
    public virtual ICollection<RequestItem> Items { get; set; } = new List<RequestItem>();
}