using AuthService.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UserService.Domain.Entities;

namespace UserService.Persistence.Context;

public class UserDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public DbSet<FamilyMessage> FamilyMessages { get; set; } = default!;
    public DbSet<UserSubscription> Subscriptions { get; set; } = default!;

    public UserDbContext(DbContextOptions<UserDbContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(UserDbContext).Assembly);
    }
}
