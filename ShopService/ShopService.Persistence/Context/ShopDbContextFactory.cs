using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ShopService.Persistence.Context;

public class ShopDbContextFactory : IDesignTimeDbContextFactory<ShopDbContext>
{
    public ShopDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<ShopDbContext>();
        var conn = Environment.GetEnvironmentVariable("SHOPSERVICE_CONNECTION")
                   ?? "Host=localhost;Database=shopservice;Username=postgres;Password=postgres";
        builder.UseNpgsql(conn);
        return new ShopDbContext(builder.Options);
    }
}
