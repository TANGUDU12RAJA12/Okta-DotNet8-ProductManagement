using Microsoft.EntityFrameworkCore;
using ProducutManagement.Models;

namespace ProducutManagement.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Explicitly ensure EF Core maps entity to 'Product' table
            modelBuilder.Entity<Product>().ToTable("Product");
        }
    }
}
