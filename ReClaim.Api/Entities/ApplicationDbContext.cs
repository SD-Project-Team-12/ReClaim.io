using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities; 
using ReClaim.Api.Domain.Entities;

namespace ReClaim.Api
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

     
        public DbSet<Logistics> Logistics { get; set; } 
        
        
        public DbSet<RecyclingRequest> RecyclingRequests { get; set; } 
        public DbSet<RequestItem> RequestItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("postgis"); 

          
            modelBuilder.Entity<RecyclingRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PickupLocation)
                      .HasColumnType("geometry(Point, 4326)"); 
            });

            modelBuilder.Entity<RequestItem>()
                .HasOne(i => i.RecyclingRequest)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.RecyclingRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }
    }
}