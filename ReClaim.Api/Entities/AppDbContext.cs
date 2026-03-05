using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;

namespace ReClaim.Api
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Logistics> Logistics { get; set; }
        public DbSet<PickUpRequest> PickUpRequests { get; set; }
        public DbSet<RecyclerApplication> RecyclerApplications { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("postgis");

            modelBuilder.Entity<User>().ToTable("tbl_identity");
            modelBuilder.Entity<PickUpRequest>().ToTable("tbl_pickup_requests");
            modelBuilder.Entity<RecyclerApplication>().ToTable("tbl_recycler_applications");

            base.OnModelCreating(modelBuilder);
        }
    }
}