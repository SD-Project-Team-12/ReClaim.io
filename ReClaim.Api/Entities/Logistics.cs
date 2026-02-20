using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace ReClaim.Api.Entities
{
    [Table("tbl_logistics")]
    public class Logistics
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("assigned_recycler_id")]
        public Guid AssignedRecyclerId { get; set; }

        // Added 'required' to tell the compiler this will never be null
        [Required]
        [Column("geo_spatial", TypeName = "geometry (point)")]
        public required Point GeoSpatial { get; set; } 

        [Column("shard_key")]
        public int ShardKey { get; set; }

        // Added '?' to make it a nullable string, or you could use 'required' here too
        [Column("status")]
        public string? Status { get; set; } 
    }
}