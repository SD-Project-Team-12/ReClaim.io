using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReClaim.Api.Domain.Enums;

namespace ReClaim.Api.Domain.Entities;

[Table("tbl_request_items")]
public class RequestItem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("recycling_request_id")]
    public Guid RecyclingRequestId { get; set; }

    [Column("type")]
    public WasteType Type { get; set; }

    [Column("estimated_weight_kg", TypeName = "decimal(10,2)")]
    public decimal EstimatedWeightKg { get; set; }

    [Column("photo_url")]
    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    [Column("predicted_value", TypeName = "decimal(10,2)")]
    public decimal PredictedValue { get; set; }

    // Navigation property
    public virtual RecyclingRequest RecyclingRequest { get; set; } = null!;
}