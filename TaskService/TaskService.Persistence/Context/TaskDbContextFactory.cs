using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TaskService.Persistence.Context;

public class TaskDbContextFactory : IDesignTimeDbContextFactory<TaskDbContext>
{
    public TaskDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<TaskDbContext>();
        // Default to local Postgres; change via env var at design time if needed.
        var conn = Environment.GetEnvironmentVariable("TASKSERVICE_CONNECTION") ?? "Host=localhost;Database=taskservice;Username=postgres;Password=postgres";
        builder.UseNpgsql(conn);
        return new TaskDbContext(builder.Options);
    }
}