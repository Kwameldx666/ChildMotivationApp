namespace AuthService.Infrastructure.Services.Quartz;

internal record QuartzCleanJobOptions
{
    public required string Key { get; set; }
    public required string IdentityTrigger { get; set; }
    public required int IntervalHours { get; set; }
}