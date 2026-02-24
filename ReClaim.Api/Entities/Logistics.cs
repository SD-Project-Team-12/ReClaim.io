using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace ReClaim.Api.Entities; 
[Table("tbl_logistics")]
public class Logistics
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("assigned_recycler_id")]
    public Guid AssignedRecyclerId { get; set; }

    [Required]
    [Column("geo_spatial", TypeName = "geometry (point)")]
    public Point GeoSpatial { get; set; } = null!;

    [Column("shard_key")]
    public int ShardKey { get; set; }

    [Column("status")]
    public string? Status { get; set; } 
}