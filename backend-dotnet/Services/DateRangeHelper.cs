namespace LeadGrowth.Services;

public static class DateRangeHelper
{
    public static (DateTime Start, DateTime End) ParsePeriodRange(string? period, string? startDate, string? endDate)
    {
        var now = DateTime.UtcNow;
        DateTime start;
        DateTime end = now.Date.AddDays(1).AddTicks(-1);

        if (string.IsNullOrWhiteSpace(period) || "all".Equals(period, StringComparison.OrdinalIgnoreCase))
        {
            start = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            return (start, end);
        }

        switch (period.ToLowerInvariant().Trim())
        {
            case "daily":
            case "today":
                start = now.Date;
                end = now.Date.AddDays(1).AddTicks(-1);
                break;
            case "weekly":
            case "this week":
            case "this_week":
                int diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
                start = now.Date.AddDays(-1 * diff);
                end = now.Date.AddDays(1).AddTicks(-1);
                break;
            case "monthly":
            case "this month":
            case "this_month":
                start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                end = now.Date.AddDays(1).AddTicks(-1);
                break;
            case "yearly":
            case "this year":
            case "this_year":
                start = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                end = now.Date.AddDays(1).AddTicks(-1);
                break;
            case "custom":
                if (!string.IsNullOrWhiteSpace(startDate) && DateTime.TryParse(startDate.Trim(), out var parsedStart))
                {
                    start = DateTime.SpecifyKind(parsedStart.Date, DateTimeKind.Utc);
                }
                else
                {
                    start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                }

                if (!string.IsNullOrWhiteSpace(endDate) && DateTime.TryParse(endDate.Trim(), out var parsedEnd))
                {
                    end = DateTime.SpecifyKind(parsedEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                }
                else
                {
                    end = now.Date.AddDays(1).AddTicks(-1);
                }
                break;
            default:
                start = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                break;
        }

        return (start, end);
    }
}
