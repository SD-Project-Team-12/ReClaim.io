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

        // Map your tables here
        public DbSet<Logistics> Logistics { get; set; }
        // public DbSet<Inventory> Inventory { get; set; } // Map other tables later

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Ensure the PostGIS extension is enabled on the PostgreSQL database
            modelBuilder.HasPostgresExtension("postgis");

            // You can also enforce your concurrency control here later
            // modelBuilder.Entity<Inventory>()
            //    .Property(i => i.RowVersion)
            //    .IsRowVersion();

            base.OnModelCreating(modelBuilder);
        }
    }
}