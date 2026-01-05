using TaskService.Domain.Enums;

namespace TaskService.Domain.ValueObjects;

public static class MissionCycle
{
    public static DateTime GetAnchorDate(DateTime utcNow, MissionRecurrence recurrence)
    {
        var date = utcNow.Date;
        return recurrence switch
        {
            MissionRecurrence.Weekly => date.AddDays(-GetOffsetFromMonday(date.DayOfWeek)),
            _ => date
        };
    }

    private static int GetOffsetFromMonday(DayOfWeek dayOfWeek)
    {
        return dayOfWeek switch
        {
            DayOfWeek.Monday => 0,
            DayOfWeek.Tuesday => 1,
            DayOfWeek.Wednesday => 2,
            DayOfWeek.Thursday => 3,
            DayOfWeek.Friday => 4,
            DayOfWeek.Saturday => 5,
            DayOfWeek.Sunday => 6,
            _ => 0
        };
    }
}
