using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;

namespace ReClaim.Api
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } 
        public DbSet<Logistics> Logistics { get; set; }
        public DbSet<PickUpRequest> PickUpRequests { get; set; } 

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Keep your PostGIS extension
            modelBuilder.HasPostgresExtension("postgis");

            // Explicitly map table names for clarity in Postgres
            modelBuilder.Entity<User>().ToTable("tbl_identity");
            modelBuilder.Entity<PickUpRequest>().ToTable("tbl_pickup_requests");

            base.OnModelCreating(modelBuilder);
        }
    }
}